import { unix } from "../../src/utils/time";

describe("unix timestamp", () => {
  it("should return an integer", () => {
    Date.now = () => 1500;
    return expect(unix()).toBe(1);
  });
  it("should return valid offsets", () => {
    Date.now = () => 0;
    expect(unix("-1 min")).toBe(-60);
    return expect(unix("-1 weeks")).toBe(-(60 * 60 * 24 * 7));
  });
});
