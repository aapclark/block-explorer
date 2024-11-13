import { Controller, Get, Query, UseFilters } from "@nestjs/common";
import { ApiTags, ApiExcludeController } from "@nestjs/swagger";
import { PagingOptionsWithMaxItemsLimitDto } from "../dtos/common/pagingOptionsWithMaxItemsLimit.dto";
import { ParseAddressPipe } from "../../common/pipes/parseAddress.pipe";
import { ParseLimitedIntPipe } from "../../common/pipes/parseLimitedInt.pipe";
import { ResponseStatus, ResponseMessage } from "../dtos/common/responseBase.dto";
import { ApiExceptionFilter } from "../exceptionFilter";
import { LogsResponseDto } from "../dtos/log/logs.dto";
import { LogService } from "../../log/log.service";
import { mapLogListItem } from "../mappers/logMapper";
import { ParseTopicParamsPipe } from "../../common/pipes/parseTopicParams.pipe";
import { ParseTopicOperatorPipe, TopicOperator } from "../../common/pipes/parseTopicOperator.pipe";
import { ParseTopicPipe } from "../../common/pipes/parseTopic.pipe";

const entityName = "logs";

@ApiExcludeController()
@ApiTags(entityName)
@Controller(`api/${entityName}`)
@UseFilters(ApiExceptionFilter)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get("/getLogs")
  public async getLogs(
    @Query("address", new ParseAddressPipe({ required: false, errorMessage: "Error! Invalid address format" }))
    address: string | undefined,
    @Query() pagingOptions: PagingOptionsWithMaxItemsLimitDto,
    @Query("fromBlock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) fromBlock?: number,
    @Query("toBlock", new ParseLimitedIntPipe({ min: 0, isOptional: true })) toBlock?: number,
    @Query("topic0", new ParseTopicPipe({ required: false, errorMessage: "Error! Invalid topic format" }))
    topic0?: string,
    @Query("topic1", new ParseTopicPipe({ required: false, errorMessage: "Error! Invalid topic format" }))
    topic1?: string,
    @Query(
      "topic0_1_opr",
      new ParseTopicOperatorPipe({
        required: false,
        errorMessage: "Error! topic0_1_opr must be 'and' or 'or' when topic0 and topic1 are provided",
      })
    )
    topic0And1Opr?: string,
    @Query("topic2", new ParseTopicPipe({ required: false, errorMessage: "Error! Invalid topic format" }))
    topic2?: string,
    @Query(
      "topic0_2_opr",
      new ParseTopicOperatorPipe({
        required: false,
        errorMessage: "Error! topic0_2_opr must be 'and' or 'or' when topic0 and topic2 are provided",
      })
    )
    topic0And2Opr?: string,
    @Query(
      "topic1_2_opr",
      new ParseTopicOperatorPipe({
        required: false,
        errorMessage: "Error! topic1_2_opr must be 'and' or 'or' when topic1 and topic2 are provided",
      })
    )
    topic1And2Opr?: string,
    @Query("topic3", new ParseTopicPipe({ required: false, errorMessage: "Error! Invalid topic format" }))
    topic3?: string,
    @Query(
      "topic0_3_opr",
      new ParseTopicOperatorPipe({
        required: false,
        errorMessage: "Error! topic0_3_opr must be 'and' or 'or' when topic0 and topic3 are provided",
      })
    )
    topic0And3Opr?: string,
    @Query(
      "topic1_3_opr",
      new ParseTopicOperatorPipe({
        required: false,
        errorMessage: "Error! topic1_3_opr must be 'and' or 'or' when topic1 and topic3 are provided",
      })
    )
    topic1And3Opr?: string,
    @Query(
      "topic2_3_opr",
      new ParseTopicOperatorPipe({
        required: false,
        errorMessage: "Error! topic2_3_opr must be 'and' or 'or' when topic2 and topic3 are provided",
      })
    )
    topic2And3Opr?: TopicOperator
  ): Promise<LogsResponseDto> {
    const paramsPipe = new ParseTopicParamsPipe();
    const topicsParams = paramsPipe.transform({
      topic0,
      topic1,
      topic2,
      topic3,
      topic0And1Opr,
      topic0And2Opr,
      topic0And3Opr,
      topic1And2Opr,
      topic1And3Opr,
      topic2And3Opr,
    });
    const logs = await this.logService.findMany({
      address,
      fromBlock,
      toBlock,
      ...pagingOptions,
      topics: topicsParams,
    });
    const logsList = logs.map((log) => mapLogListItem(log));
    return {
      status: logsList.length ? ResponseStatus.OK : ResponseStatus.NOTOK,
      message: logsList.length ? ResponseMessage.OK : ResponseMessage.NO_RECORD_FOUND,
      result: logsList,
    };
  }
}
