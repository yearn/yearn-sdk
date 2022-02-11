import { chunkArray } from "./helpers";

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
            [5, 6]
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
});
