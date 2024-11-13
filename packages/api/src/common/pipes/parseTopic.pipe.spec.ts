import { BadRequestException } from "@nestjs/common";
import { ParseTopicPipe } from "./parseTopic.pipe";

describe("ParseTopicPipe", () => {
  let pipe: ParseTopicPipe;

  beforeEach(() => {
    pipe = new ParseTopicPipe();
  });

  it("should transform valid topic", () => {
    const topic = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    expect(pipe.transform(topic)).toBe(topic.toLowerCase());
  });

  it("should transform valid topic without 0x prefix", () => {
    const topic = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    expect(pipe.transform(topic)).toBe(topic.toLowerCase());
  });

  it("should transform array of valid topics when each is true", () => {
    const pipe = new ParseTopicPipe({ each: true });
    const topics = [
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    ];
    expect(pipe.transform(topics)).toEqual(topics.map((topic) => topic.toLowerCase()));
  });

  it("should throw error for invalid topic length", () => {
    const topic = "0x1234";
    expect(() => pipe.transform(topic)).toThrow(BadRequestException);
  });

  it("should throw error for non-hex characters", () => {
    const topic = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg";
    expect(() => pipe.transform(topic)).toThrow(BadRequestException);
  });

  it("should throw error when each is true but value is not array", () => {
    const pipe = new ParseTopicPipe({ each: true });
    const topic = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    expect(() => pipe.transform(topic)).toThrow(BadRequestException);
  });

  it("should return undefined for non-required empty value", () => {
    const pipe = new ParseTopicPipe({ required: false });
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it("should use custom error message", () => {
    const errorMessage = "Custom error";
    const pipe = new ParseTopicPipe({ errorMessage });
    const topic = "invalid";
    expect(() => pipe.transform(topic)).toThrow(errorMessage);
  });
});
