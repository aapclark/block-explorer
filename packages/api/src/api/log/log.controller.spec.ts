import { Test } from "@nestjs/testing";
import { mock } from "jest-mock-extended";
import { LogService } from "../../log/log.service";
import { Logger } from "@nestjs/common";
import { LogController } from "./log.controller";

jest.mock("../mappers/logMapper", () => ({
  ...jest.requireActual("../mappers/logMapper"),
  mapLogListItem: jest.fn().mockImplementation((logs) => logs),
}));

describe("LogController", () => {
  let controller: LogController;
  let logServiceMock: LogService;

  const address = "address";
  beforeEach(async () => {
    logServiceMock = mock<LogService>({
      findMany: jest.fn().mockResolvedValue([
        {
          logIndex: 1,
        },
        {
          logIndex: 2,
        },
      ]),
    });

    const module = await Test.createTestingModule({
      controllers: [LogController],
      providers: [
        {
          provide: LogService,
          useValue: logServiceMock,
        },
      ],
    }).compile();
    module.useLogger(mock<Logger>());

    controller = module.get<LogController>(LogController);
  });

  describe("getLogs", () => {
    const topicA = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const topicB = "0x0000000000000000000000000000000000000000000000000000000000000000";
    it("calls logs service with specified filter and paging params", async () => {
      await controller.getLogs(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        0,
        10
      );
      expect(logServiceMock.findMany).toBeCalledTimes(1);
      expect(logServiceMock.findMany).toBeCalledWith({
        address,
        fromBlock: 0,
        toBlock: 10,
        page: 2,
        offset: 20,
        maxLimit: 10000,
        topics: [],
      });
    });

    it("calls logs service with single topic param", async () => {
      await controller.getLogs(
        address,
        {
          page: 0,
          offset: 0,
          maxLimit: 10000,
        },
        0,
        10,
        topicA
      );
      expect(logServiceMock.findMany).toBeCalledTimes(1);
      expect(logServiceMock.findMany).toBeCalledWith({
        address,
        fromBlock: 0,
        toBlock: 10,
        page: 0,
        offset: 0,
        maxLimit: 10000,
        topics: topicA,
      });
    });

    it("calls logs service with multiple topics and operator", async () => {
      await controller.getLogs(
        address,
        {
          page: 0,
          offset: 0,
          maxLimit: 10000,
        },
        0,
        10,
        topicA,
        topicB,
        "and"
      );
      expect(logServiceMock.findMany).toBeCalledTimes(1);
      expect(logServiceMock.findMany).toBeCalledWith({
        address,
        fromBlock: 0,
        toBlock: 10,
        page: 0,
        offset: 0,
        maxLimit: 10000,
        topics: [{ topics: [topicA, topicB], operator: "AND" }],
      });
    });

    it("returns ok response and logs list when logs are found", async () => {
      const response = await controller.getLogs(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        0,
        10
      );
      expect(response).toEqual({
        message: "OK",
        result: [
          {
            logIndex: 1,
          },
          {
            logIndex: 2,
          },
        ],
        status: "1",
      });
    });

    it("returns not ok response and empty logs list when logs are not found", async () => {
      (logServiceMock.findMany as jest.Mock).mockResolvedValueOnce([]);
      const response = await controller.getLogs(
        address,
        {
          page: 2,
          offset: 20,
          maxLimit: 10000,
        },
        0,
        10
      );
      expect(response).toEqual({
        message: "No record found",
        result: [],
        status: "0",
      });
    });
  });
});
