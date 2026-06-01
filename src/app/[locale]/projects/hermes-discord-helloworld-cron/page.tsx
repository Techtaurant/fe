import Header from "@/components/Header";

const implementationSteps = [
  {
    title: "Hermes 설치 상태 확인",
    description:
      "Hermes CLI가 설치되어 있는지 확인하고, gateway/cron을 사용할 수 있는 버전인지 검증했습니다.",
    evidence: "hermes --version → Hermes Agent v0.15.1",
    prLocation: "Runtime check only / repository PR 없음",
  },
  {
    title: "Discord 전송 대상 확정",
    description:
      "Hermes messaging target 목록에서 TimeLabs 서버의 #chat-bot 채널을 선택했습니다.",
    evidence: "deliver target → discord:#chat-bot",
    prLocation: "Runtime channel binding / repository PR 없음",
  },
  {
    title: "고정 메시지 스크립트 작성",
    description:
      "LLM 호출 없이 정확히 같은 메시지만 보내도록 no-agent cron용 스크립트를 만들었습니다.",
    evidence: "$HERMES_HOME/scripts/helloworld_chatbot.py → stdout: helloworld",
    prLocation: "Hermes default profile runtime file / repository PR 없음",
  },
  {
    title: "10분 반복 cron 등록",
    description:
      "Hermes cron에 10분마다 실행되는 no-agent job을 등록하고 Discord #chat-bot으로 stdout을 직접 전달하도록 설정했습니다.",
    evidence: "job_id 9353ebce6125, schedule every 10m, repeat forever",
    prLocation: "Hermes cron job 9353ebce6125 / repository PR 없음",
  },
  {
    title: "즉시 실행 검증",
    description:
      "등록 직후 수동 trigger로 한 번 실행해 실제 cron output과 delivery 상태를 확인했습니다.",
    evidence: "last_status ok, output helloworld, next_run_at +10m",
    prLocation: "Runtime verification / repository PR 없음",
  },
  {
    title: "TechTaurant 진행 내역 문서화",
    description:
      "이 페이지에 설치·채널 선택·스크립트·cron 등록·검증 순서와 작업 위치를 남겼습니다.",
    evidence: "route /ko/projects/hermes-discord-helloworld-cron",
    prLocation: "https://github.com/Techtaurant/fe/pull/TBD",
  },
];

const commandBlocks = [
  {
    label: "Hermes 설치",
    code: "curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash\nhermes setup",
  },
  {
    label: "Discord gateway 확인",
    code: "hermes gateway status\nhermes cron status",
  },
  {
    label: "no-agent 메시지 스크립트",
    code: "mkdir -p ~/.hermes/scripts\nprintf 'print(\"helloworld\")\\n' > ~/.hermes/scripts/helloworld_chatbot.py",
  },
  {
    label: "Hermes cron 설정 요약",
    code: "name: helloworld-chatbot-discord-10m\nschedule: every 10m\nrepeat: forever\ndeliver: discord:#chat-bot\nscript: helloworld_chatbot.py\nmode: no-agent",
  },
];

export async function generateMetadata() {
  return {
    title: "Hermes Discord helloworld cron setup | TechTaurant",
    description:
      "Hermes Agent로 Discord #chat-bot 채널에 helloworld를 10분마다 보내는 cron 구성 절차와 검증 기록입니다.",
  };
}

export default function HermesDiscordHelloworldCronPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:px-6 lg:py-14">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Hermes Agent automation
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Discord #chat-bot에 10분마다 helloworld 보내기
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            Hermes Agent의 cron scheduler와 Discord gateway를 사용해 TimeLabs 서버의
            #chat-bot 채널로 고정 메시지 <code className="rounded bg-muted px-1.5 py-0.5">helloworld</code>를
            반복 전송하도록 구성한 작업 기록입니다. 메시지는 LLM을 거치지 않는 no-agent script
            stdout으로 전달되므로 비용과 응답 변동이 없습니다.
          </p>
          <dl className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 p-4">
              <dt className="text-sm font-semibold text-muted-foreground">Cron job</dt>
              <dd className="mt-2 font-mono text-sm">9353ebce6125</dd>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <dt className="text-sm font-semibold text-muted-foreground">Schedule</dt>
              <dd className="mt-2 font-mono text-sm">every 10m / forever</dd>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <dt className="text-sm font-semibold text-muted-foreground">Delivery</dt>
              <dd className="mt-2 font-mono text-sm">discord:#chat-bot</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">진행 순서와 작업 위치</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-12 bg-muted/70 px-4 py-3 text-sm font-bold text-muted-foreground">
              <span className="col-span-1">#</span>
              <span className="col-span-4">단계</span>
              <span className="col-span-4">검증/증거</span>
              <span className="col-span-3">PR 또는 작업 위치</span>
            </div>
            {implementationSteps.map((step, index) => (
              <article
                className="grid grid-cols-12 gap-y-3 border-t border-border px-4 py-5 text-sm md:items-start"
                key={step.title}
              >
                <div className="col-span-1 font-mono text-muted-foreground">
                  {index + 1}
                </div>
                <div className="col-span-11 md:col-span-4">
                  <h3 className="font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 leading-6 text-muted-foreground">{step.description}</p>
                </div>
                <p className="col-span-11 col-start-2 font-mono text-xs leading-6 text-foreground md:col-span-4 md:col-start-auto">
                  {step.evidence}
                </p>
                <p className="col-span-11 col-start-2 break-words text-xs leading-6 text-muted-foreground md:col-span-3 md:col-start-auto">
                  {step.prLocation.startsWith("https://") ? (
                    <a className="font-semibold text-primary underline-offset-4 hover:underline" href={step.prLocation}>
                      {step.prLocation}
                    </a>
                  ) : (
                    step.prLocation
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">재현용 명령/설정</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {commandBlocks.map((block) => (
              <div className="rounded-2xl border border-border bg-card p-5" key={block.label}>
                <h3 className="text-sm font-bold text-muted-foreground">{block.label}</h3>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6">
                  <code>{block.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-bold">운영 메모</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            <li>고정 메시지 전송은 no-agent mode로 구성해 LLM 호출 비용과 문구 변동을 제거했습니다.</li>
            <li>stdout이 비어 있으면 전송하지 않는 Hermes cron 특성상, 스크립트는 항상 한 줄을 출력합니다.</li>
            <li>장애 시에는 <code className="rounded bg-background px-1.5 py-0.5">hermes cron list</code>에서 last_status와 last_delivery_error를 먼저 확인합니다.</li>
            <li>중지하려면 <code className="rounded bg-background px-1.5 py-0.5">hermes cron pause 9353ebce6125</code> 또는 remove를 사용합니다.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
