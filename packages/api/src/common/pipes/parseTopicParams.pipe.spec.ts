import { BadRequestException } from "@nestjs/common";
import { TopicOperator } from "./parseTopicOperator.pipe";
import { ParseTopicParamsPipe } from "./parseTopicParams.pipe";

describe("ParseTopicParamsPipe", () => {
  let pipe: ParseTopicParamsPipe;
  beforeEach(() => {
    pipe = new ParseTopicParamsPipe();
  });
  const topicA = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const topicB = "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70f54";
  const topicC = "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70e22";
  const topicNames = ["topic0", "topic1", "topic2", "topic3"];

  describe("transform", () => {
    describe("throws a BadRequestException", () => {
      it("if provided multiple topics without operators", () => {
        const pipe = new ParseTopicParamsPipe();
        expect(() => pipe.transform({ topic0: topicA, topic1: topicB })).toThrowError(
          new BadRequestException("Invalid topic params operators must be provided when specifying multiple topics")
        );
      });
      it("if provided operators without matching topics", () => {
        const pipe = new ParseTopicParamsPipe();
        const expectedMissingTopicKey = "topic0_1_opr";
        expect(() => pipe.transform({ topic0: topicA, topic2: topicB, topic0And1Opr: TopicOperator.AND })).toThrowError(
          new BadRequestException(`Invalid topic params missing topic for operator ${expectedMissingTopicKey}`)
        );
      });
    });
    it("should allow single topic in any of the four topic fields", () => {
      pipe = new ParseTopicParamsPipe();
      topicNames.forEach((topic) => {
        const pipe = new ParseTopicParamsPipe();
        const result = pipe.transform({ [topic]: topicA });
        expect(result).toEqual(topicA);
      });
    });

    it("should transform operator with two matching topics", () => {
      const pipe = new ParseTopicParamsPipe();
      const result = pipe.transform({
        topic0: topicA,
        topic1: topicB,
        topic0And1Opr: "or",
      }) as Array<{ topics: [string, string]; operator: TopicOperator }>;
      expect(result).toBeInstanceOf(Array);
      expect(result).toContainEqual({
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70f54",
        ],
        operator: TopicOperator.OR,
      });
    });
    it("should transform two operators with three matching topics", () => {
      const pipe = new ParseTopicParamsPipe();
      const result = pipe.transform({
        topic0: topicA,
        topic1: topicB,
        topic2: topicC,
        topic0And1Opr: "or",
        topic1And2Opr: "and",
      }) as Array<{ topics: [string, string]; operator: TopicOperator }>;
      expect(result).toBeInstanceOf(Array);

      expect(result).toContainEqual({
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70f54",
        ],
        operator: "OR",
      });
      expect(result).toContainEqual({
        topics: [
          "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70f54",
          "0x000000000000000000000000481e48ce19781c3ca573967216dee75fdcf70e22",
        ],
        operator: TopicOperator.AND,
      });
    });
  });
});
