import { BadRequestException } from "@nestjs/common";
import { PipeTransform, Injectable } from "@nestjs/common";
import { TopicOption } from "../../log/log.service";

interface ParamOptions {
  errorMessage?: string;
}

type Topics = {
  topic0?: string;
  topic1?: string;
  topic2?: string;
  topic3?: string;
};

type TopicOperatorKeys = {
  topic0And1Opr?: string;
  topic1And2Opr?: string;
  topic2And3Opr?: string;
  topic0And2Opr?: string;
  topic0And3Opr?: string;
  topic1And3Opr?: string;
};

type TopicOperatorsInput = Topics & TopicOperatorKeys;

export type TopicsWithOperators = string | Array<TopicOption>;

@Injectable()
export class ParseTopicParamsPipe implements PipeTransform<TopicOperatorsInput, TopicsWithOperators> {
  public readonly options: ParamOptions;
  private readonly operatorMap: Map<string, [string, string]> = new Map([
    ["topic0And1Opr", ["topic0", "topic1"]],
    ["topic1And2Opr", ["topic1", "topic2"]],
    ["topic2And3Opr", ["topic2", "topic3"]],
    ["topic0And2Opr", ["topic0", "topic2"]],
    ["topic0And3Opr", ["topic0", "topic3"]],
    ["topic1And3Opr", ["topic1", "topic3"]],
  ]);

  private readonly operatorInputKeyMap: Map<string, string> = new Map([
    ["topic0And1Opr", "topic0_1_opr"],
    ["topic1And2Opr", "topic1_2_opr"],
    ["topic2And3Opr", "topic2_3_opr"],
    ["topic0And2Opr", "topic0_2_opr"],
    ["topic0And3Opr", "topic0_3_opr"],
    ["topic1And3Opr", "topic1_3_opr"],
  ]);

  constructor({ errorMessage = "Invalid topic params" }: ParamOptions = {}) {
    this.options = {
      errorMessage,
    };
  }

  public transform(value: TopicOperatorsInput): TopicsWithOperators {
    if (!value) {
      return undefined;
    }

    const providedTopics = (({ topic0, topic1, topic2, topic3 }) => [topic0, topic1, topic2, topic3])(value);
    const providedOperators = (({
      topic0And1Opr,
      topic1And2Opr,
      topic2And3Opr,
      topic0And2Opr,
      topic0And3Opr,
      topic1And3Opr,
    }) => [topic0And1Opr, topic1And2Opr, topic2And3Opr, topic0And2Opr, topic0And3Opr, topic1And3Opr])(value);

    if (providedTopics.filter((topic) => topic !== undefined).length === 1) {
      if (providedOperators.filter((op) => op !== undefined).length > 0) {
        throw new BadRequestException(
          this.options.errorMessage + " " + "topic operators must not be provided with a single topic"
        );
      }
      return providedTopics.find((t) => t !== undefined);
    }
    if (
      providedTopics.filter((topic) => topic !== undefined).length > 1 &&
      providedOperators.filter((op) => op !== undefined).length === 0
    ) {
      throw new BadRequestException(
        this.options.errorMessage + " " + "operators must be provided when specifying multiple topics"
      );
    } else {
      const topicsWithOperators: TopicsWithOperators = [];
      for (const key of this.operatorMap.keys()) {
        const operator = value[key];
        if (operator) {
          const [leftTopic, rightTopic] = this.getTopicsForOperator(value, key);
          if (leftTopic === undefined || rightTopic === undefined) {
            throw new BadRequestException(
              this.options.errorMessage + " " + `missing topic for operator ${this.operatorInputKeyMap.get(key)}`
            );
          }
          topicsWithOperators.push({ topics: [leftTopic, rightTopic], operator: operator.toUpperCase() });
        }
      }
      return topicsWithOperators;
    }
  }

  private getTopicsForOperator(
    value: TopicOperatorsInput,
    operatorKey: string
  ): [string | undefined, string | undefined] {
    const topicPair = this.operatorMap.get(operatorKey);
    const [left, right] = topicPair;
    return [value[left], value[right]];
  }
}
