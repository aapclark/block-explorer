import { BadRequestException } from "@nestjs/common";
import { PipeTransform, Injectable } from "@nestjs/common";

interface ParamOptions {
  required?: boolean;
  errorMessage?: string;
}

export enum TopicOperator {
  AND = "AND",
  OR = "OR",
}

@Injectable()
export class ParseTopicOperatorPipe implements PipeTransform {
  public readonly options: ParamOptions;

  constructor({ required = true, errorMessage = "operator must be 'and' or 'or'" }: ParamOptions = {}) {
    this.options = {
      required,
      errorMessage,
    };
  }

  private readonly operatorMap = {
    and: TopicOperator.AND,
    or: TopicOperator.OR,
  } as const;

  public transform(value: string): TopicOperator | undefined {
    if (!this.options.required && !value) {
      return undefined;
    }
    if (this.options.required && !value) {
      throw new BadRequestException(this.options.errorMessage);
    }

    const operator = this.operatorMap[value];
    if (operator) {
      return operator;
    } else {
      throw new BadRequestException(this.options.errorMessage);
    }
  }
}
