import { BadRequestException } from "@nestjs/common";
import { ParseTopicOperatorPipe, TopicOperator } from "./parseTopicOperator.pipe";

describe("ParseTopicOperatorPipe", () => {
  let pipe: ParseTopicOperatorPipe;
  beforeEach(() => {
    pipe = new ParseTopicOperatorPipe();
  });
  describe("transform", () => {
    describe("throws a BadRequestException", () => {
      it("if value is required but input is empty", () => {
        const pipe = new ParseTopicOperatorPipe();
        expect(() => pipe.transform("")).toThrowError(new BadRequestException("operator must be 'and' or 'or'"));
      });
      it("if value is neither 'and' nor 'or'", () => {
        const pipe = new ParseTopicOperatorPipe();
        expect(() => pipe.transform("and or or")).toThrowError(
          new BadRequestException("operator must be 'and' or 'or'")
        );
      });
    });
    it("returns and when input is 'and'", () => {
      const pipe = new ParseTopicOperatorPipe();
      const result = pipe.transform("and");
      expect(result).toEqual(TopicOperator.AND);
    });
    it("returns and when input is 'or'", () => {
      const pipe = new ParseTopicOperatorPipe();
      const result = pipe.transform("or");
      expect(result).toEqual(TopicOperator.OR);
    });
    it("should return undefined when not required and value is empty", () => {
      pipe = new ParseTopicOperatorPipe({ required: false });
      expect(pipe.transform("")).toBeUndefined();
    });
  });
});
