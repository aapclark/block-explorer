import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual, LessThanOrEqual, SelectQueryBuilder, FindOperator } from "typeorm";
import { Pagination } from "nestjs-typeorm-paginate";
import { IPaginationOptions } from "../common/types";
import { paginate } from "../common/utils";
import { Log } from "./log.entity";
import { TopicOperator } from "../common/pipes/parseTopicOperator.pipe";
import { hexTransformer } from "../common/transformers/hex.transformer";

export interface FilterLogsOptions {
  transactionHash?: string;
  address?: string;
}

export type TopicOption = {
  topics: [string, string];
  operator: TopicOperator;
};

export interface FilterLogsByAddressOptions {
  address?: string;
  fromBlock?: number;
  toBlock?: number;
  page?: number;
  offset?: number;
  topics?: string | Array<TopicOption>;
}

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>
  ) {}

  public async findAll(
    filterOptions: FilterLogsOptions = {},
    paginationOptions: IPaginationOptions
  ): Promise<Pagination<Log>> {
    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.where(filterOptions);
    queryBuilder.orderBy("log.timestamp", "DESC");
    queryBuilder.addOrderBy("log.logIndex", "ASC");
    return await paginate<Log>(queryBuilder, paginationOptions);
  }

  public async findMany({
    address,
    fromBlock,
    toBlock,
    page = 1,
    offset = 10,
    topics,
  }: FilterLogsByAddressOptions): Promise<Log[]> {
    const queryBuilder = this.logRepository.createQueryBuilder("log");
    queryBuilder.leftJoin("log.transaction", "transaction");
    queryBuilder.leftJoin("transaction.transactionReceipt", "transactionReceipt");
    queryBuilder.addSelect(["transaction.gasPrice", "transactionReceipt.gasUsed"]);

    if (address !== undefined) {
      this.applyWhereClause(queryBuilder, { address });
    }
    if (topics !== undefined) {
      if (typeof topics === "string") {
        const condition = ":topic = ANY(log.topics)";
        const parameters = { topic: hexTransformer.to(topics) };
        this.applyWhereClause(queryBuilder, condition, parameters);
      } else {
        const conditions: string[] = [];
        const parameters: Record<string, Buffer> = {};
        /* because the topics clauses are more complex, TypeOrm cannot apply the `transformer`
          assigned to the `topics` column in the entity definition.*/
        topics.forEach((topic, i) => {
          const [topicA, topicB] = topic.topics;
          const paramA = `topic${i}a`;
          const paramB = `topic${i}b`;

          parameters[paramA] = hexTransformer.to(topicA);
          parameters[paramB] = hexTransformer.to(topicB);

          const topicCondition1 = `:${paramA} = ANY(log.topics)`;
          const topicCondition2 = `:${paramB} = ANY(log.topics)`;

          conditions.push(`${topicCondition1} ${topic.operator} ${topicCondition2}`);
        });

        // This length check prevents an empty where clause being applied
        if (conditions.length > 0) {
          const clause = conditions.join(" AND ");
          this.applyWhereClause(queryBuilder, clause, parameters);
        }
      }
    }
    if (fromBlock !== undefined) {
      this.applyWhereClause(queryBuilder, {
        blockNumber: MoreThanOrEqual(fromBlock),
      });
    }
    if (toBlock !== undefined) {
      this.applyWhereClause(queryBuilder, {
        blockNumber: LessThanOrEqual(toBlock),
      });
    }

    queryBuilder.offset((page - 1) * offset);
    queryBuilder.limit(offset);
    queryBuilder.orderBy("log.blockNumber", "ASC");
    queryBuilder.addOrderBy("log.logIndex", "ASC");
    return await queryBuilder.getMany();
  }

  // applyWhereClause ensures that the query builder properly calls `where` before `andWhere`
  private applyWhereClause = (
    qb: SelectQueryBuilder<Log>,
    condition: string | Record<string, string | FindOperator<number>>,
    params?: any
  ) => {
    const hasExistingWhere = qb.expressionMap.wheres.length > 0;
    return hasExistingWhere ? qb.andWhere(condition, params) : qb.where(condition, params);
  };
}
