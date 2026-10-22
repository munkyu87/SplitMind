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

const questions: { slug: string; title: string; choices: string[] }[] = [
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

  const existing = await prisma.question.count();
  if (existing > 0) return;

  for (const item of questions) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: item.slug } });
    await prisma.question.create({
      data: {
        title: item.title,
        source: QuestionSource.seed,
        status: "published",
        publishedAt: new Date(),
        choices: {
          create: item.choices.map((content, choiceIndex) => ({ choiceIndex, content })),
        },
        categories: { create: [{ categoryId: category.id }] },
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
