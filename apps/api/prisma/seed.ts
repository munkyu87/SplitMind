import { PrismaClient, QuestionSource } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "love", name: "연애", sortOrder: 1, requiresAdult: false },
  { slug: "friendship", name: "우정", sortOrder: 2, requiresAdult: false },
  { slug: "work", name: "직장", sortOrder: 3, requiresAdult: false },
  { slug: "daily", name: "일상", sortOrder: 4, requiresAdult: false },
  { slug: "moral", name: "도덕", sortOrder: 5, requiresAdult: false },
  { slug: "society", name: "사회", sortOrder: 6, requiresAdult: false },
  { slug: "adult", name: "19금", sortOrder: 7, requiresAdult: true },
];

const questions: { slug: string; title: string; description?: string; choices: string[] }[] = [
  { slug: "moral", title: "1억을 받고 가장 싫어하는 사람에게 50억이 간다 vs 아무것도 받지 않는다", choices: ["1억을 받는다", "아무것도 받지 않는다"] },
  { slug: "friendship", title: "몰래카메라를 내가 당한다 vs 친한 친구가 대신 당하게 둔다", choices: ["내가 당한다", "친구가 당하게 둔다"] },
  { slug: "work", title: "회사 전원이 내 일기장을 읽게 된다. 어떤 쪽이 나은가", choices: ["업무 일기만 읽힌다", "사생활 일기만 읽힌다"] },
  { slug: "love", title: "연인이 내 전 애인 단톡을 보게 된다 vs 내가 연인의 전 애인 단톡을 본다", choices: ["내 단톡이 보인다", "상대 단톡을 본다"] },
  { slug: "daily", title: "평생 맛있는 음식을 못 먹는다 vs 평생 음악을 못 듣는다", choices: ["음식을 포기한다", "음악을 포기한다"] },
  { slug: "society", title: "아무도 모르는 횡령 100만 원을 신고한다 vs 그냥 넘어간다", choices: ["신고한다", "넘어간다"] },
  { slug: "friendship", title: "친구가 몰래 내 흑역사를 캡처해 뒀다. 어떻게 할까", choices: ["당장 삭제하라고 한다", "모르는 척한다"] },
  { slug: "work", title: "승진이 보장되는 부서 이동 vs 지금 팀이 유지되는 연봉 동결", choices: ["승진 부서로 간다", "팀에 남는다"] },
  { slug: "love", title: "애인이 내 휴대폰 비밀번호를 알고 있다 vs 내가 애인 비밀번호를 알고 있다", choices: ["애인이 내 폰을 열 수 있다", "내가 애인 폰을 열 수 있다"] },
  { slug: "moral", title: "길을 잃은 아이 지갑에서 떨어진 용돈 5만 원을 집는다 vs 그냥 지나친다", choices: ["주인을 찾아 준다", "못 본 척한다"] },
  { slug: "daily", title: "매주 월요일에 비가 온다 vs 매주 금요일에 비가 온다", choices: ["월요일 비", "금요일 비"] },
  { slug: "society", title: "내 동네에 쓰레기 소각장이 생긴다 vs 출퇴근이 1시간 더 걸린다", choices: ["소각장을 받아들인다", "출퇴근을 늘린다"] },
  { slug: "work", title: "회의에서 상사의 틀린 숫자를 바로잡는다 vs 끝나고 슬랙으로만 말한다", choices: ["그 자리에서 말한다", "나중에 따로 말한다"] },
  { slug: "friendship", title: "10년 친구가 내 뒷담을 한 걸 들었다. 다음 약속에 나간다", choices: ["아무렇지 않게 나간다", "약속을 끊는다"] },
  { slug: "love", title: "소개팅 상대가 내 친구의 전 연인이다. 계속 만난다", choices: ["만난다", "그만둔다"] },
  { slug: "moral", title: "무인 가게에서 계산이 안 됐다. 다시 가서 낸다 vs 그냥 나온다", choices: ["다시 낸다", "그냥 나온다"] },
  {
    slug: "love",
    title: "10년 지기 친구의 전 연인이 나에게 고백했다면?",
    description:
      "당신에게는 10년 동안 친하게 지낸 친구가 있습니다.\n\n대학 시절부터 서로의 고민을 나누고 서로를 응원해 온 사이입니다. 취업이 안 되던 해에도, 가족이 아플 때도, 새벽까지 통화를 하며 버텼습니다. 친구는 당신의 전 연인 이야기까지 알고 있고, 당신이 다시 사람을 만나는 일을 누구보다 반겼습니다.\n\n어느 날 소개팅에서 만난 사람이 알고 보니 그 친구의 전 연인이었습니다. 두 사람은 3년 전에 헤어졌습니다. 당시에는 서로 많이 지쳤고, 지금 친구는 다른 사람과 1년째 만나고 있습니다.\n\n소개팅 상대는 처음 두 번은 친구 이야기를 거의 하지 않았습니다. 세 번째 만남에서야 예전에 사귀던 사람이 당신의 친구라는 걸 알았다고 말했습니다. 이미 정리된 사이이고, 친구의 지금 연인도 알고 있는 과거라고 했습니다.\n\n몇 번 더 만나 보니 상대와 생각보다 잘 맞습니다. 주말의 속도, 갈등을 미루지 않는 말투, 가족 이야기를 꺼내는 타이밍까지 편합니다. 상대는 진지하게 계속 보고 싶다고 합니다.\n\n문제는 친구입니다. 친구는 아직도 그 사람을 가끔 언급합니다. 나쁘게 말하는 것은 아니지만, 그때의 자신을 아직 설명하고 싶어 합니다. 당신에게는 새 만남을 응원한다고 하면서도, 상대의 이름을 듣는 순간 표정이 달라질 사람입니다.\n\n친구에게 지금 말하면 우정이 흔들릴 수 있습니다. 말하지 않으면, 공통 지인이 많은 이 동네에서 언젠가 더 크게 들킵니다. 상대는 당신이 정할 때까지 기다리겠다고 했지만, 비밀로 두는 관계는 원하지 않는다고 했습니다.",
    choices: ["친구에게 말하고 계속 만난다", "말하지 않고 만난다", "친구를 위해 정리한다", "친구에게 먼저 물어본다"],
  },
  {
    slug: "work",
    title: "금요일 밤, 상사가 주말 확인을 부탁했다",
    description:
      "금요일 저녁 아홉 시, 상사가 메시지를 보냈습니다. 월요일 임원 회의에 올릴 자료에서 숫자 하나만 다시 확인해 달라는 내용입니다. 문장 끝에는 편할 때 봐 달라는 말이 붙어 있지만, 지난달에도 그 문장 뒤에 토요일 아침 추가 요청이 이어졌습니다.\n\n이번 주 당신은 마감 때문에 이틀을 야근했습니다. 수요일에는 집에서 저녁을 걸렀고, 목요일에는 막차를 탔습니다. 토요일 아침에는 오래 미뤄 둔 친구 약속이 있고, 일요일에는 가족 생일이 있습니다.\n\n자료를 열어 보니 틀린 숫자는 작아 보입니다. 다만 그 숫자가 비용 합계로 넘어가 있어서, 그대로 두면 회의에서 상사가 곤란해질 수 있습니다. 고치는 데는 십 분이면 됩니다. 문제는 답장을 하는 순간입니다. 상사는 읽음이 뜨면 바로 다음 질문을 보내는 사람입니다.\n\n팀 동료 한 명은 이미 메시지를 읽고 답하지 않았다고 합니다. 그 동료는 주말 연락에 답하면 그 속도가 기준이 된다고 말합니다. 또 다른 동료는 숫자 하나 때문에 상사가 월요일에 당황하는 건 팀이 함께 뒤집어쓰는 일이라고 합니다.\n\n상사는 답장이 없으면 토요일 오전에 다시 연락합니다. 이번에는 자료 하나만 보면 끝이 날 수도 있고, 지난번처럼 주말 내내 수정이 이어질 수도 있습니다.",
    choices: ["바로 확인하고 답한다", "월요일 아침에 본다", "긴급한지 먼저 물어본다"],
  },
  {
    slug: "friendship",
    title: "친구가 내 연애 이야기를 다른 사람들에게 말했다",
    description:
      "친한 친구에게만 털어놓은 이별 이야기가 공통 지인들의 단톡에 돌아다니고 있습니다. 이름은 빠져 있지만, 어디서 만나 어디까지 갔는지가 그대로라 읽는 사람은 당신인 걸 압니다.\n\n그 이야기는 단둘이 있을 때만 하겠다고 미리 말해 둔 내용이었습니다. 친구도 그때 알겠다고 했습니다. 그런데 친구는 너무 걱정돼서 다른 친구 둘에게 조언을 구했다고 합니다. 그 둘이 또 다른 방에 옮기면서 이야기가 커졌습니다.\n\n친구는 사과했습니다. 악의는 없었고, 당신이 혼자 앓는 게 안타까웠다고 합니다. 실제로 몇 사람은 걱정한다며 당신에게 먼저 연락했습니다. 그 연락이 위로가 된 것도 사실입니다. 동시에, 당신이 고르지 않은 사람들에게 관계의 세부가 알려져 있습니다.\n\n친구는 이미 퍼진 말을 거둬 달라고 하기는 어렵다고 합니다. 단톡에서 정정 메시지를 보내면 오히려 더 많은 사람이 알게 될 수 있습니다. 다음 주에는 그 사람들이 모두 모이는 식사 자리가 있습니다.\n\n그 자리에서 선을 그으면 친구는 공개적으로 잘못을 인정해야 합니다. 단둘이 다시 말하면 관계는 남지만, 이미 아는 사람들의 시선은 그대로입니다. 거리를 두면 편해질 수도 있고, 오랜 우정을 스스로 끝내는 일이 될 수도 있습니다.",
    choices: ["그 자리에서 선을 긋는다", "단둘이 다시 이야기한다", "당분간 거리를 둔다", "이번만 넘긴다"],
  },
  {
    slug: "moral",
    title: "카페에서 거스름돈이 만 원 더 나왔다",
    description:
      "바쁜 카페에서 카드를 내려 했는데, 알바생이 현금을 받은 줄 알고 만 원을 건넵니다. 당신은 이미 결제가 된 걸 알고 있습니다.\n\n뒤에도 줄이 길고, 알바생은 주문을 외우느라 영수증을 보지 않습니다. 만 원을 돌려주면 계산이 꼬였다고 혼날 수도 있어 보입니다.\n\n매장 밖까지 나왔는데, 주머니 속 만 원이 계속 마음에 걸립니다. 다시 들어가면 줄을 거꾸로 비집고 들어가야 합니다.",
    choices: ["다시 들어가 돌려준다", "그대로 가져간다"],
  },
  {
    slug: "daily",
    title: "휴가를 한 번에 쓸까, 나눠 쓸까",
    description:
      "올해 남은 휴가는 열흘입니다. 한 번에 쓰면 멀리 다녀올 수 있지만, 팀이 그 기간 동안 당신을 기다려야 합니다.\n\n나눠 쓰면 달마다 사흘씩 쉴 수 있습니다. 대신 비행기 값을 몇 번이나 내게 되고, 돌아와서 쌓인 일을 반복해서 치워야 합니다.\n\n상사는 둘 다 괜찮다고 했지만, 한 번에 비우는 쪽을 더 부담스러워합니다. 가족은 긴 여행을, 친구들은 짧은 약속을 기다리고 있습니다.",
    choices: ["한 번에 길게 쉰다", "여러 번 나눠 쉰다"],
  },
  {
    slug: "society",
    title: "동네 공원이 주차장으로 바뀌는 투표다",
    description:
      "살고 있는 동의 유일한 공원을 주민 주차장으로 바꾸자는 투표가 열렸습니다. 저녁마다 골목은 이중 주차로 막히고, 아이들은 그 공원에서만 놉니다.\n\n찬성 쪽은 주차 전쟁이 줄면 다툼도 줄어든다고 합니다. 반대 쪽은 공원이 없어지면 아이들이 차로 나갈 곳이 없다고 합니다.\n\n당신은 차가 한 대 있고, 주말에는 그 공원 벤치에 앉습니다. 투표는 이번 주 일요일에 끝납니다.",
    choices: ["주차장에 찬성한다", "공원을 지킨다", "기권한다"],
  },
  {
    slug: "work",
    title: "회식 자리에서 술잔이 돌아온다",
    choices: ["받는다", "정중히 거절한다", "음료로 대신한다", "자리를 먼저 빠진다"],
  },
  {
    slug: "love",
    title: "연인이 갑자기 주말 여행을 제안했다",
    choices: ["바로 같이 간다", "일정을 조율한다", "이번엔 쉰다"],
  },
  {
    slug: "daily",
    title: "알람을 다섯 개 맞출까, 하나만 맞출까",
    choices: ["여러 개 맞춘다", "하나만 맞춘다"],
  },
  {
    slug: "society",
    title: "우리 동네에 대형 쇼핑몰이 들어온다",
    choices: ["찬성한다", "반대한다", "조건을 보고 정한다"],
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder, requiresAdult: category.requiresAdult },
      create: category,
    });
  }

  await prisma.aiGenerationSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      enabled: false,
      cadence: "manual",
      prompt:
        "사용자의 심리를 자극하고, 곤란하고 찐한 상황을 던지는 질문을 1개 생성해줘. 선택지는 2~4개. 성적으로 노골적인 표현은 빼.",
    },
  });

  const now = Date.now();
  let added = 0;
  for (const item of questions) {
    const already = await prisma.question.findFirst({ where: { title: item.title } });
    if (already) {
      if (item.description && already.source === QuestionSource.seed && already.description !== item.description) {
        await prisma.question.update({ where: { id: already.id }, data: { description: item.description } });
      }
      continue;
    }
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.slug } });
    await prisma.question.create({
      data: {
        title: item.title,
        description: item.description,
        source: QuestionSource.seed,
        status: "published",
        publishedAt: new Date(now - added * 60_000),
        choices: {
          create: item.choices.map((content, choiceIndex) => ({ choiceIndex, content })),
        },
        categories: { create: [{ categoryId: category.id }] },
      },
    });
    added += 1;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
