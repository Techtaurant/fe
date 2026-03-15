import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNextLikeCount,
  inferReactionFromServer,
  resolveReactionState,
} from "../app/utils/reactionCounter.js";

test("좋아요/싫어요 상태 변화가 카운트를 올바르게 반영한다", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: 0,
      currentReaction: "none",
      nextReaction: "like",
    }),
    1,
  );
});

test("같은 좋아요를 다시 누르면 카운트가 감소한다", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: 1,
      currentReaction: "like",
      nextReaction: "none",
    }),
    0,
  );
});

test("기본 0에서 싫어요 누르면 -1", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: 0,
      currentReaction: "none",
      nextReaction: "dislike",
    }),
    -1,
  );
});

test("1에서 싫어요 누르면 0", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: 1,
      currentReaction: "none",
      nextReaction: "dislike",
    }),
    0,
  );
});

test("싫어요 상태에서 해제하면 1 증가한다", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: -1,
      currentReaction: "dislike",
      nextReaction: "none",
    }),
    0,
  );
});

test("서버 응답이 좋아요인 경우 좋아요 상태를 반환한다", () => {
  assert.equal(
    inferReactionFromServer({
      isLiked: true,
      likeCount: 1,
    }),
    "like",
  );
});

test("서버가 isLiked false면 사용자 반응은 미선택으로 처리한다", () => {
  assert.equal(
    inferReactionFromServer({
      isLiked: false,
      likeCount: -1,
    }),
    "none",
  );
});

test("기본 반응이 none이고 likeCount가 -1이어도 like를 누르면 +1이 아닌 0이 된다", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: -1,
      currentReaction: "none",
      nextReaction: "like",
    }),
    0,
  );
});

test("기본 반응이 none이고 likeCount가 -1에서 dislike를 누르면 -2가 된다", () => {
  assert.equal(
    calculateNextLikeCount({
      currentLikeCount: -1,
      currentReaction: "none",
      nextReaction: "dislike",
    }),
    -2,
  );
});

test("서버가 none일 때 저장된 반응값을 유지한다", () => {
  assert.equal(
    resolveReactionState({
      override: null,
      serverReaction: "none",
      storedReaction: "like",
    }),
    "like",
  );
});

test("서버 반응이 like/dislike일 때는 서버 상태를 우선한다", () => {
  assert.equal(
    resolveReactionState({
      override: null,
      serverReaction: "like",
      storedReaction: "none",
    }),
    "like",
  );

  assert.equal(
    resolveReactionState({
      override: null,
      serverReaction: "dislike",
      storedReaction: "like",
    }),
    "dislike",
  );
});
