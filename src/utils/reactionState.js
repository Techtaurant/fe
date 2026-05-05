/**
 * @typedef {"like" | "dislike" | "none"} ReactionState
 * @typedef {"NONE" | "LIKE" | "DISLIKE"} LikeStatus
 */

/**
 * API likeStatus 값을 UI reaction 상태로 변환합니다.
 * @param {LikeStatus | undefined} likeStatus
 * @returns {ReactionState}
 */
export function toReactionState(likeStatus) {
  if (likeStatus === "LIKE") return "like";
  if (likeStatus === "DISLIKE") return "dislike";
  return "none";
}

/**
 * UI reaction 상태를 API likeStatus 값으로 변환합니다.
 * @param {ReactionState} reaction
 * @returns {LikeStatus}
 */
export function toLikeStatus(reaction) {
  if (reaction === "like") return "LIKE";
  if (reaction === "dislike") return "DISLIKE";
  return "NONE";
}

/**
 * 현재 반응과 클릭 타겟을 기반으로 다음 반응 상태를 계산합니다.
 * 같은 버튼 재클릭 시 none으로 토글됩니다.
 * @param {ReactionState} currentReaction
 * @param {"like" | "dislike"} target
 * @returns {ReactionState}
 */
export function resolveNextReaction(currentReaction, target) {
  return currentReaction === target ? "none" : target;
}
