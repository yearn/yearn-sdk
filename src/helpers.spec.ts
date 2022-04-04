import {
  chunkArray,
  convertSecondsMillisOrMicrosToMillis,
  EthAddress,
  isNativeToken,
  mergeByAddress,
  ZeroAddress,
} from "./helpers";

describe("Helpers", () => {
  describe("chunkArray", () => {
    describe("when size is zero", () => {
      it("should throw", () => {
        try {
          chunkArray([1, 2, 3, 4, 5, 6], 0);
        } catch (error) {
          expect(error).toStrictEqual(new Error("Size needs to be positive: 0"));
        }
      });
    });

    describe("when size is positive", () => {
      describe("when size is less or equal to array length", () => {
        it("should split the array into smaller arrays of the size provided", () => {
          const chunkedArray = chunkArray([1, 2, 3, 4, 5, 6], 2);
          const chunkedArrayWithOneSize = chunkArray([1, 2, 3, 4, 5, 6], 1);
          const chunkedArrayWithSizeSameLengthOfArray = chunkArray([1, 2, 3, 4, 5, 6], 6);
          const chunkedArrayWithUnevenItems = chunkArray([1, 2, 3, 4, 5], 2);

          expect(chunkedArray.length).toBe(3);
          expect(chunkedArray).toEqual([
            [1, 2],
            [3, 4],
            [5, 6],
          ]);
          expect(chunkedArrayWithOneSize.length).toBe(6);
          expect(chunkedArrayWithOneSize).toEqual([[1], [2], [3], [4], [5], [6]]);
          expect(chunkedArrayWithSizeSameLengthOfArray.length).toBe(1);
          expect(chunkedArrayWithSizeSameLengthOfArray).toEqual([[1, 2, 3, 4, 5, 6]]);
          expect(chunkedArrayWithUnevenItems.length).toBe(3);
          expect(chunkedArrayWithUnevenItems).toEqual([[1, 2], [3, 4], [5]]);
        });
      });

      describe("when size is bigger than array length", () => {
        it("should return the original array inside another array", () => {
          const chunkedArray = chunkArray([1, 2, 3, 4, 5, 6], 7);

          expect(chunkedArray.length).toBe(1);
          expect(chunkedArray).toEqual([[1, 2, 3, 4, 5, 6]]);
        });
      });
    });
  });

  describe("anyTimestampToMillis", () => {
    describe("with string input", () => {
      it("should convert a unix timestamp from seconds to millis", () => {
        expect(convertSecondsMillisOrMicrosToMillis("9999999999")).toEqual(9999999999000);
        expect(convertSecondsMillisOrMicrosToMillis("1000000000")).toEqual(1000000000000);
        expect(convertSecondsMillisOrMicrosToMillis("0000000001")).toEqual(1000);
      });
      it("should convert a unix timestamp from microseconds to millis", () => {
        expect(convertSecondsMillisOrMicrosToMillis("9999999999999000")).toEqual(9999999999999);
        expect(convertSecondsMillisOrMicrosToMillis("1000000000000000")).toEqual(1000000000000);
        expect(convertSecondsMillisOrMicrosToMillis("0000000001000000")).toEqual(1000);
      });
      it("should keep timestamps in millis intact", () => {
        expect(convertSecondsMillisOrMicrosToMillis("9999999999999")).toEqual(9999999999999);
        expect(convertSecondsMillisOrMicrosToMillis("1000000000000")).toEqual(1000000000000);
        expect(convertSecondsMillisOrMicrosToMillis("0000000001000")).toEqual(1000);
      });
      it("should throw in case of too long numbers", () => {
        expect(() => convertSecondsMillisOrMicrosToMillis("10000000000000000")).toThrowError(
          "Timestamp in invalid format"
        );
      });
    });
    describe("with number input", () => {
      it("should convert a unix timestamp from seconds to millis", () => {
        expect(convertSecondsMillisOrMicrosToMillis(9999999999)).toEqual(9999999999000);
        expect(convertSecondsMillisOrMicrosToMillis(1000000000)).toEqual(1000000000000);
        expect(convertSecondsMillisOrMicrosToMillis(1)).toEqual(1000);
      });
      it("should convert a unix timestamp from microseconds to millis", () => {
        expect(convertSecondsMillisOrMicrosToMillis(9999999999999000)).toEqual(9999999999999);
        expect(convertSecondsMillisOrMicrosToMillis(1000000000000000)).toEqual(1000000000000);
      });
      it("should keep timestamps in millis intact", () => {
        expect(convertSecondsMillisOrMicrosToMillis(9999999999999)).toEqual(9999999999999);
        expect(convertSecondsMillisOrMicrosToMillis(1000000000000)).toEqual(1000000000000);
      });
      it("should throw in case of too long numbers", () => {
        expect(() => convertSecondsMillisOrMicrosToMillis(10000000000000000)).toThrowError(
          "Timestamp in invalid format"
        );
      });
    });
  });

  describe("isNativeToken", () => {
    describe("with EthAddress", () => {
      it("should be truthy", () => {
        const result = isNativeToken(EthAddress);
        expect(result).toBeTruthy();
      });
    });
    describe("with ZeroAddress", () => {
      it("should be truthy", () => {
        const result = isNativeToken(ZeroAddress);
        expect(result).toBeTruthy();
      });
    });
    describe("with non native address", () => {
      it("should be falsy", () => {
        const result = isNativeToken("0xNonNative");
        expect(result).toBeFalsy();
      });
    });
  });

  describe("mergeByAddress", () => {
    describe("when there are objects with the same address", () => {
      it("should merge", () => {
        const actual = mergeByAddress([{ address: "0x00", foo: "foo" }], [{ address: "0x00", foo: "bar", bar: "bar" }]);

        expect(actual).toStrictEqual([{ address: "0x00", foo: "foo" }]);
      });
    });

    describe("when there are not objects with the same address", () => {
      it("should not merge", () => {
        const actual = mergeByAddress([{ address: "0x00", foo: "foo" }], [{ address: "0x01", bar: "bar" }]);

        expect(actual).toStrictEqual([
          { address: "0x00", foo: "foo" },
          { address: "0x01", bar: "bar" },
        ]);
      });
    });
  });
});
