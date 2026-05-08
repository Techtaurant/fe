#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');

/**
 * Type Coverage 결과를 분석하여 PR 코멘트용 마크다운 생성
 */
function generateCoverageReport() {
  // 필수 파일 존재 확인
  const currentCoveragePath = '.type-coverage/current.json';
  const previousCoveragePath = '.github/type-coverage/previous.json';

  if (!fs.existsSync(currentCoveragePath)) {
    console.error('❌ Error: .type-coverage/current.json 파일을 찾을 수 없습니다.');
    console.error('\n다음 명령어를 먼저 실행하세요:');
    console.error('  npm run type-coverage:json\n');
    process.exit(1);
  }

  if (!fs.existsSync('coverage-detail.txt')) {
    console.error('❌ Error: coverage-detail.txt 파일을 찾을 수 없습니다.');
    console.error('\n다음 명령어를 먼저 실행하세요:');
    console.error('  npm run type-coverage:detail > coverage-detail.txt\n');
    process.exit(1);
  }

  // 현재 type-coverage.json 읽기
  const coverageData = JSON.parse(fs.readFileSync(currentCoveragePath, 'utf8'));

  // 이전 coverage 데이터 읽기 (있는 경우)
  let previousCoverageData = null;
  if (fs.existsSync(previousCoveragePath)) {
    try {
      previousCoverageData = JSON.parse(fs.readFileSync(previousCoveragePath, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Warning: 이전 coverage 데이터를 읽을 수 없습니다:', error.message);
    }
  }

  // coverage-detail.txt 읽기 (any가 사용된 위치 상세 정보)
  const detailText = fs.readFileSync('coverage-detail.txt', 'utf8');

  // 환경 변수에서 base coverage 가져오기
  const baseCoverage = parseFloat(process.env.BASE_COVERAGE || '0');
  const prCoverage = parseFloat(coverageData.percentString || coverageData.percent);
  const diff = prCoverage - baseCoverage;

  // any가 사용된 파일별 정보 파싱
  const anyUsages = parseAnyUsages(detailText);

  // any 타입 개수 계산
  const anyCount = coverageData.totalCount - coverageData.correctCount;

  // 이전 데이터와 비교 분석
  const changeAnalysis = previousCoverageData
    ? analyzeChanges(previousCoverageData, coverageData, anyUsages)
    : null;

  // 마크다운 생성
  const markdown = generateMarkdown({
    baseCoverage,
    prCoverage,
    diff,
    anyUsages,
    totalCount: coverageData.totalCount,
    correctCount: coverageData.correctCount,
    anyCount: anyCount,
    changeAnalysis,
  });

  // 파일로 저장
  fs.writeFileSync('coverage-comment.md', markdown);

  console.log('✅ Coverage report generated successfully');
  console.log(`📊 Type Coverage: ${prCoverage.toFixed(2)}%`);
  console.log(`📈 Change: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`);

  if (changeAnalysis) {
    console.log(`\n📝 Changes from previous run:`);
    console.log(`  - Files added: ${changeAnalysis.filesAdded.length}`);
    console.log(`  - Files improved: ${changeAnalysis.filesImproved.length}`);
    console.log(`  - Files regressed: ${changeAnalysis.filesRegressed.length}`);
  }
}

/**
 * type-coverage detail 출력 파싱하여 any 사용 정보 추출
 */
function parseAnyUsages(detailText) {
  const lines = detailText.split('\n');
  const usagesByFile = {};

  for (const line of lines) {
    // 빈 라인, npm 출력, 요약 라인 무시
    if (
      !line.trim() ||
      line.startsWith('>') ||
      line.includes('type-coverage success') ||
      line.match(/^\(\d+ \/ \d+\)/)
    ) {
      continue;
    }

    // 형식: /full/path/to/file.ts:line:column: variable_name
    const match = line.match(/^(.+?\.tsx?):(\d+):(\d+):\s*(.+)$/);
    if (match) {
      const [, filePath, lineNum, column, message] = match;

      // 프로젝트 루트 기준 상대 경로로 변환
      const relativePath = filePath.includes('devdeb-fe-config-type-coverage')
        ? filePath.split('devdeb-fe-config-type-coverage/')[1]
        : filePath;

      if (!usagesByFile[relativePath]) {
        usagesByFile[relativePath] = [];
      }

      usagesByFile[relativePath].push({
        line: parseInt(lineNum),
        column: parseInt(column),
        message: message.trim(),
      });
    }
  }

  return usagesByFile;
}

/**
 * 이전 coverage와 현재 coverage 비교 분석
 */
function analyzeChanges(previous, current, currentAnyUsages) {
  const prevAnyCount = previous.totalCount - previous.correctCount;
  const currAnyCount = current.totalCount - current.correctCount;

  const prevCoverage = parseFloat(previous.percentString || previous.percent);
  const currCoverage = parseFloat(current.percentString || current.percent);

  // 파일별 any 개수 계산
  const currentFileAnyCounts = {};
  for (const [file, usages] of Object.entries(currentAnyUsages)) {
    currentFileAnyCounts[file] = usages.length;
  }

  // 새로 추가된 파일 (이전에 없던 파일)
  const filesAdded = Object.keys(currentAnyUsages).filter((file) => {
    // 간단하게 파일명으로 판단 (더 정확한 비교를 위해서는 파일별 데이터 필요)
    return currentFileAnyCounts[file] > 0;
  });

  // 파일별 비교는 detail 정보가 필요하므로 여기서는 전체 통계만 제공
  return {
    previousCoverage: prevCoverage,
    currentCoverage: currCoverage,
    coverageDiff: currCoverage - prevCoverage,

    previousAnyCount: prevAnyCount,
    currentAnyCount: currAnyCount,
    anyCountDiff: currAnyCount - prevAnyCount,

    previousTotalCount: previous.totalCount,
    currentTotalCount: current.totalCount,
    totalCountDiff: current.totalCount - previous.totalCount,

    filesAdded: filesAdded.length > 0 ? filesAdded.slice(0, 5) : [],
    filesImproved: [], // detail 정보가 있어야 정확히 계산 가능
    filesRegressed: [], // detail 정보가 있어야 정확히 계산 가능
  };
}

/**
 * PR 코멘트용 마크다운 생성
 */
function generateMarkdown({
  baseCoverage,
  prCoverage,
  diff,
  anyUsages,
  totalCount,
  correctCount,
  anyCount,
  changeAnalysis,
}) {
  const diffEmoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
  const diffSign = diff > 0 ? '+' : '';
  const diffColor = diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪';

  const passThreshold = prCoverage >= 95;
  const statusEmoji = passThreshold ? '✅' : '❌';
  const statusText = passThreshold
    ? 'Type coverage가 기준을 충족합니다!'
    : '⚠️ Type coverage가 95% 미만입니다. PR을 머지할 수 없습니다.';

  let markdown = `## 📊 Type Coverage Report

${statusEmoji} **${statusText}**

### Coverage Summary

| Metric | Value |
|--------|-------|
| **Current Coverage** | **${prCoverage.toFixed(2)}%** |
| Base Coverage | ${baseCoverage.toFixed(2)}% |
| Change | ${diffColor} ${diffEmoji} ${diffSign}${diff.toFixed(2)}% |
| Threshold | 95% |

### Type Statistics

- **Total Symbols**: ${totalCount.toLocaleString()}
- **Correctly Typed**: ${correctCount.toLocaleString()}
- **Any Types**: ${anyCount.toLocaleString()}

`;

  // 이전 실행과의 비교 정보 추가
  if (changeAnalysis) {
    const anyDiffEmoji =
      changeAnalysis.anyCountDiff < 0 ? '🟢' : changeAnalysis.anyCountDiff > 0 ? '🔴' : '⚪';
    const anyDiffSign = changeAnalysis.anyCountDiff > 0 ? '+' : '';
    const coverageDiffEmoji =
      changeAnalysis.coverageDiff > 0 ? '📈' : changeAnalysis.coverageDiff < 0 ? '📉' : '➡️';
    const coverageDiffSign = changeAnalysis.coverageDiff > 0 ? '+' : '';

    markdown += `### 📊 Changes from Previous Run

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Coverage | ${changeAnalysis.previousCoverage.toFixed(2)}% | ${changeAnalysis.currentCoverage.toFixed(2)}% | ${coverageDiffEmoji} ${coverageDiffSign}${changeAnalysis.coverageDiff.toFixed(2)}% |
| Total Symbols | ${changeAnalysis.previousTotalCount.toLocaleString()} | ${changeAnalysis.currentTotalCount.toLocaleString()} | ${changeAnalysis.totalCountDiff > 0 ? '+' : ''}${changeAnalysis.totalCountDiff.toLocaleString()} |
| Any Types | ${changeAnalysis.previousAnyCount.toLocaleString()} | ${changeAnalysis.currentAnyCount.toLocaleString()} | ${anyDiffEmoji} ${anyDiffSign}${changeAnalysis.anyCountDiff.toLocaleString()} |

`;

    if (changeAnalysis.anyCountDiff < 0) {
      markdown += `✨ **Great job!** \`any\` 타입이 ${Math.abs(changeAnalysis.anyCountDiff)}개 줄었습니다!\n\n`;
    } else if (changeAnalysis.anyCountDiff > 0) {
      markdown += `⚠️ **주의:** \`any\` 타입이 ${changeAnalysis.anyCountDiff}개 늘었습니다.\n\n`;
    }
  }

  // any가 사용된 파일 목록
  const fileCount = Object.keys(anyUsages).length;

  if (fileCount > 0) {
    markdown += `### 🔍 Files with \`any\` Types (${fileCount} files)

`;

    // 파일별로 정렬
    const sortedFiles = Object.entries(anyUsages).sort((a, b) => {
      return b[1].length - a[1].length; // any 사용 횟수로 내림차순 정렬
    });

    // 최대 10개 파일만 표시
    const filesToShow = sortedFiles.slice(0, 10);

    for (const [filePath, usages] of filesToShow) {
      markdown += `<details>
<summary><code>${filePath}</code> (${usages.length} occurrences)</summary>

\`\`\`
${usages
  .slice(0, 5) // 파일당 최대 5개 위치만 표시
  .map((u) => `Line ${u.line}:${u.column} - ${u.message}`)
  .join('\n')}${usages.length > 5 ? `\n... and ${usages.length - 5} more` : ''}
\`\`\`

</details>

`;
    }

    if (sortedFiles.length > 10) {
      markdown += `_... and ${sortedFiles.length - 10} more files_\n\n`;
    }

    markdown += `
> 💡 **Tip**: \`any\` 타입 사용을 줄이려면:
> - 명시적 타입 정의 사용
> - \`unknown\` 타입 고려
> - 제네릭 타입 활용
> - 타입 가드 함수 작성
`;
  } else {
    markdown += `### ✨ Perfect! No \`any\` types found!\n\n`;
  }

  markdown += `
---
_Type coverage checked by [type-coverage](https://github.com/plantain-00/type-coverage)_
`;

  return markdown;
}

// 스크립트 실행
try {
  generateCoverageReport();
} catch (error) {
  console.error('❌ Error generating coverage report:', error);
  process.exit(1);
}
