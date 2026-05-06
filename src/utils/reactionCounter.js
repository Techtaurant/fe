/**
 * @typedef {"like" | "dislike" | "none"} ReactionState

 * @typedef {Object} ReactionCountInput
 * @property {number} currentLikeCount
 * @property {ReactionState} currentReaction
 * @property {ReactionState} nextReaction
 */

/**
 * 이전 반응 상태와 다음 반응 상태에 따라 좋아요 카운트를 계산합니다.
 */
export function calculateNextLikeCount({
  currentLikeCount,
  currentReaction,
  nextReaction,
}) {
  const reactionDelta = {
    like: 1,
    dislike: -1,
    none: 0,
  };

  return (
    currentLikeCount +
    reactionDelta[nextReaction] -
    reactionDelta[currentReaction]
  );
}

/**
 * 서버 응답을 기반으로 좋아요/싫어요 버튼 상태를 추론합니다.
 */
export function inferReactionFromServer({ likeStatus }) {
  if (likeStatus === "LIKE") {
    return "like";
  }

  if (likeStatus === "DISLIKE") {
    return "dislike";
  }

  return "none";
}

/**
 * 좋아요 버튼 표시 상태를 반영 우선순위에 따라 합성합니다.
 */
export function resolveReactionState({
  override,
  serverReaction,
  storedReaction,
}) {
  if (override) {
    return override;
  }

  if (!serverReaction || serverReaction === "none") {
    return storedReaction ?? "none";
  }

  return serverReaction;
}
