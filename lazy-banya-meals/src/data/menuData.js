const categories = ['다이어트식', '일반식', '자취식']

const dayLabel = (day) => `${day}일`

const dishTemplate = (base) => ({
  id: base.id,
  baseName: base.name,
  baseDescription: base.description,
  image: base.image,
  calories: base.calories,
  cookTime: base.cookTime,
  ingredients: base.ingredients,
  steps: base.steps
})

const dietData = {
  breakfast: [
    dishTemplate({
      id: 'diet-b-1',
      name: '계란 두부말이',
      description: '담백하고 속이 편안한 다이어트 아침',
      image: 'https://images.unsplash.com/photo-1615486364628-8f947b4f36f0?auto=format&fit=crop&w=900&q=80',
      calories: 280,
      cookTime: '10분',
      ingredients: ['계란 2개', '두부 한모', '소금 수저 반개', '물 국자 1개', '파 한줌'],
      steps: [
        {
          text: '두부를 으깨고 계란을 풀어 섞어줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '팬에 기름을 두르고 계란물을 부어 말아줍니다.',
          image: 'https://images.unsplash.com/photo-1512058564366-c9e9b05db7fa?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '먹기 좋은 크기로 자르면 완성입니다.',
          image: 'https://images.unsplash.com/photo-1514516870927-345a23bec818?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-b-2',
      name: '그린 스무디 볼',
      description: '상큼하고 가벼운 영양 가득 볼',
      image: 'https://images.unsplash.com/photo-1484981184820-2e84ea0e4b99?auto=format&fit=crop&w=900&q=80',
      calories: 260,
      cookTime: '6분',
      ingredients: ['바나나 1개', '시금치 한줌', '아몬드 우유 한컵', '치아씨드 한숟가락', '베리 한줌'],
      steps: [
        {
          text: '모든 재료를 믹서에 넣고 곱게 갈아줍니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '그릇에 부운 뒤 그래놀라와 베리를 올립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '바로 먹을 수 있는 상큼한 아침입니다.',
          image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-b-3',
      name: '닭가슴살 채소볼',
      description: '고단백 닭가슴살과 신선한 채소',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80',
      calories: 295,
      cookTime: '12분',
      ingredients: ['닭가슴살 손가락 2마디', '양상추 한줌', '방울토마토 4개', '오이 반개', '레몬 6분의1개'],
      steps: [
        {
          text: '닭가슴살을 소금과 후추로 밑간 합니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '구운 닭가슴살과 채소를 볼에 담습니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '레몬을 짜서 상큼하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-b-4',
      name: '오트밀 과일볼',
      description: '포만감 있는 곡물과 과일 아침',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 305,
      cookTime: '8분',
      ingredients: ['오트밀 한줌', '우유 한컵', '바나나 1개', '호두 한줌', '꿀 반숟가락'],
      steps: [
        {
          text: '오트밀과 우유를 냄비에 넣고 끓입니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '그릇에 담고 과일과 호두를 올립니다.',
          image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '꿀을 살짝 뿌려 달콤하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-b-5',
      name: '연어 아보카도 토스트',
      description: '건강한 지방과 단백질이 어우러진 아침',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 320,
      cookTime: '10분',
      ingredients: ['호밀빵 2조각', '훈제연어 한줌', '아보카도 반개', '레몬 6분의1개', '파슬리 조금'],
      steps: [
        {
          text: '빵을 토스트한 뒤 아보카도를 으깨 발라줍니다.',
          image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '훈제연어를 올리고 레몬즙을 뿌립니다.',
          image: 'https://images.unsplash.com/photo-1484981184820-2e84ea0e4b99?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '파슬리를 뿌린 뒤 바로 드세요.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-b-6',
      name: '시금치 달걀찜',
      description: '부드럽고 채소가 들어간 단백질 아침',
      image: 'https://images.unsplash.com/photo-1514516870927-345a23bec818?auto=format&fit=crop&w=900&q=80',
      calories: 275,
      cookTime: '9분',
      ingredients: ['계란 3개', '시금치 한줌', '간장 숟가락 1개', '물 국자 1개', '참기름 한숟가락'],
      steps: [
        {
          text: '계란과 간장, 물을 섞고 시금치를 넣어 섞습니다.',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '뚝배기나 냄비에 부어 약불에서 익힙니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '마지막으로 참기름을 떨어뜨려 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ],
  lunch: [
    dishTemplate({
      id: 'diet-l-1',
      name: '닭가슴살 채소 샐러드',
      description: '신선한 채소와 단백질이 만나는 점심',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
      calories: 330,
      cookTime: '14분',
      ingredients: ['닭가슴살 손가락 2마디', '로메인 한줌', '방울토마토 4개', '오이 반개', '발사믹 드레싱 한숟가락'],
      steps: [
        {
          text: '닭가슴살을 구워 먹기 좋은 크기로 자릅니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 함께 볼에 담고 드레싱을 뿌립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '가볍게 섞어 바로 즐기면 완성입니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-l-2',
      name: '현미 퀴노아 볼',
      description: '곡물과 채소를 함께 즐기는 든든한 점심',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 340,
      cookTime: '15분',
      ingredients: ['퀴노아 한줌', '현미밥 한공기', '아보카도 반개', '방울토마토 4개', '레몬 즙 반숟가락'],
      steps: [
        {
          text: '퀴노아를 물에 삶아 곡물 밥을 준비합니다.',
          image: 'https://images.unsplash.com/photo-1484981184820-2e84ea0e4b99?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 아보카도, 토마토를 더합니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '레몬즙을 뿌려 상큼하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-l-3',
      name: '두부 채소 스테이크',
      description: '단백질과 채소를 담백하게 구운 한 끼',
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      calories: 325,
      cookTime: '16분',
      ingredients: ['두부 한모', '버섯 두줌', '양파 반개', '올리브유 숟가락 1개', '간장 숟가락 1개'],
      steps: [
        {
          text: '두부를 두툼하게 썰어 물기를 제거합니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '버섯과 양파를 볶고 두부를 함께 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '소스를 끼얹어 감칠맛을 더합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-l-4',
      name: '참치 아보카도 샐러드',
      description: '신선한 아보카도와 참치의 조화',
      image: 'https://images.unsplash.com/photo-1529901355638-26a2b7a90595?auto=format&fit=crop&w=900&q=80',
      calories: 310,
      cookTime: '10분',
      ingredients: ['참치 캔 1개', '아보카도 반개', '양상추 한줌', '방울토마토 4개', '레몬 6분의1개'],
      steps: [
        {
          text: '참치와 아보카도를 볼에 담아 섞습니다.',
          image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '야채를 함께 올리고 레몬즙을 뿌립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '가볍게 섞어 바로 즐깁니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-l-5',
      name: '연어 샐러드 볼',
      description: '고단백 연어와 채소의 상큼한 조합',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      calories: 345,
      cookTime: '13분',
      ingredients: ['훈제연어 한줌', '로메인 한줌', '오이 반개', '방울토마토 4개', '올리브유 숟가락 1개'],
      steps: [
        {
          text: '샐러드 채소를 자르고 볼에 담습니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '훈제연어와 토마토를 올립니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '올리브유를 뿌리고 바로 드세요.',
          image: 'https://images.unsplash.com/photo-1484981184820-2e84ea0e4b99?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-l-6',
      name: '단호박 샐러드 플레이트',
      description: '달콤한 단호박과 채소를 즐기는 한 끼',
      image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb28?auto=format&fit=crop&w=900&q=80',
      calories: 335,
      cookTime: '18분',
      ingredients: ['단호박 반개', '병아리콩 한줌', '샐러드채소 한줌', '호두 한줌', '꿀 반숟가락'],
      steps: [
        {
          text: '단호박을 오븐 또는 팬에 구워 썹니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 병아리콩을 섞어 플레이팅합니다.',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '꿀을 조금 뿌려 달콤하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ],
  dinner: [
    dishTemplate({
      id: 'diet-d-1',
      name: '구운 연어와 아스파라거스',
      description: '담백한 연어와 채소가 어우러진 저녁',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 290,
      cookTime: '18분',
      ingredients: ['연어 한토막', '아스파라거스 한줌', '레몬 6분의1개', '올리브유 숟가락 1개', '소금 수저 반개'],
      steps: [
        {
          text: '연어에 소금과 올리브유를 발라 재워둡니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '연어와 아스파라거스를 함께 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '레몬을 짜서 상큼하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-d-2',
      name: '닭가슴살 버섯 스튜',
      description: '따뜻하고 담백한 가벼운 저녁',
      image: 'https://images.unsplash.com/photo-1514516870927-345a23bec818?auto=format&fit=crop&w=900&q=80',
      calories: 300,
      cookTime: '20분',
      ingredients: ['닭가슴살 손가락 2마디', '버섯 한줌', '양파 반개', '물 국자 3개', '간장 숟가락 1개'],
      steps: [
        {
          text: '닭가슴살과 채소를 썰어 냄비에 넣습니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '물을 붓고 끓여 스튜를 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '간장으로 간을 맞춰 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-d-3',
      name: '두부 야채 부침',
      description: '바삭하게 구운 두부와 채소의 조화',
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      calories: 285,
      cookTime: '14분',
      ingredients: ['두부 한모', '쪽파 한줌', '당근 조금', '소금 수저 반개', '식용유 숟가락 1개'],
      steps: [
        {
          text: '두부를 으깨고 채소를 작게 썰어 섞습니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '반죽을 팬에 부어 노릇하게 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '완성된 부침을 접시에 옮기면 완성입니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-d-4',
      name: '미니 새우 샐러드',
      description: '상큼한 새우와 채소의 가벼운 저녁',
      image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80',
      calories: 300,
      cookTime: '15분',
      ingredients: ['새우 한줌', '샐러드채소 한줌', '토마토 2개', '레몬 6분의1개', '올리브유 숟가락 1개'],
      steps: [
        {
          text: '새우를 데치고 소금을 살짝 뿌립니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 함께 볼에 담고 레몬즙을 뿌립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '올리브유를 더해 상큼하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-d-5',
      name: '버섯 닭가슴살 구이',
      description: '고소한 버섯과 닭가슴살의 담백한 조합',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 295,
      cookTime: '16분',
      ingredients: ['닭가슴살 손가락 2마디', '버섯 한줌', '파 한줌', '간장 숟가락 1개', '올리브유 숟가락 1개'],
      steps: [
        {
          text: '닭가슴살을 간장에 재워둡니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '버섯과 함께 팬에 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '잘 익으면 접시에 담아 냅니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'diet-d-6',
      name: '단호박 채소 스튜',
      description: '달콤한 단호박과 채소가 어우러진 저녁',
      image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb28?auto=format&fit=crop&w=900&q=80',
      calories: 285,
      cookTime: '15분',
      ingredients: ['단호박 반개', '양파 반개', '당근 한줌', '물 국자 3개', '간장 숟가락 1개'],
      steps: [
        {
          text: '단호박과 채소를 큼직하게 썰어 둡니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '물에 재료를 넣고 부드럽게 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '간장으로 간을 맞추고 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ]
}

const normalData = {
  breakfast: [
    dishTemplate({
      id: 'normal-b-1',
      name: '계란 베이컨 토스트',
      description: '바삭한 토스트 위에 고소한 계란과 베이컨',
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80',
      calories: 380,
      cookTime: '12분',
      ingredients: ['식빵 2조각', '계란 2개', '베이컨 2줄', '버터 한숟가락', '치즈 한장'],
      steps: [
        {
          text: '빵에 버터를 바르고 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '계란을 익혀 베이컨과 함께 올립니다.',
          image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '치즈를 녹여 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-b-2',
      name: '프렌치 토스트',
      description: '달콤한 시럽과 부드러운 식감의 아침',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
      calories: 390,
      cookTime: '11분',
      ingredients: ['식빵 2조각', '계란 2개', '우유 한컵', '버터 한숟가락', '메이플 시럽 한숟가락'],
      steps: [
        {
          text: '계란과 우유를 섞어 빵을 적십니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '버터를 녹인 팬에 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '시럽을 뿌려 달콤하게 즐깁니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-b-3',
      name: '베리 요거트 볼',
      description: '상큼한 과일과 요거트의 간편한 아침',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 360,
      cookTime: '8분',
      ingredients: ['플레인 요거트 한컵', '딸기 4개', '블루베리 한줌', '그래놀라 한줌', '꿀 반숟가락'],
      steps: [
        {
          text: '요거트를 그릇에 담습니다.',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '베리와 그래놀라를 올립니다.',
          image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '꿀을 뿌려 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-b-4',
      name: '바나나 땅콩 토스트',
      description: '고소한 땅콩버터와 바나나의 만남',
      image: 'https://images.unsplash.com/photo-1514516870927-345a23bec818?auto=format&fit=crop&w=900&q=80',
      calories: 395,
      cookTime: '10분',
      ingredients: ['식빵 2조각', '땅콩버터 한숟가락', '바나나 1개', '꿀 반숟가락', '씨앗 약간'],
      steps: [
        {
          text: '빵에 땅콩버터를 바릅니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '바나나를 얇게 썰어 올립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '꿀을 조금 더 뿌려 완성합니다.',
          image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-b-5',
      name: '치즈 스크램블 에그',
      description: '부드러운 계란과 치즈로 든든하게',
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80',
      calories: 380,
      cookTime: '9분',
      ingredients: ['계란 3개', '치즈 한줌', '버터 한숟가락', '파 한줌', '후추 약간'],
      steps: [
        {
          text: '계란을 풀고 치즈를 넣어 섞습니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '버터를 녹인 팬에 부어 부드럽게 저어줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '파를 뿌리고 바로 서빙합니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-b-6',
      name: '아보카도 베이글',
      description: '부드러운 아보카도와 베이글 한 조각',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
      calories: 400,
      cookTime: '11분',
      ingredients: ['베이글 1개', '아보카도 반개', '토마토 2조각', '레몬 6분의1개', '소금 수저 반개'],
      steps: [
        {
          text: '베이글을 반으로 갈라 구워줍니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '아보카도를 으깨어 올립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '토마토와 레몬즙을 더해 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ],
  lunch: [
    dishTemplate({
      id: 'normal-l-1',
      name: '소고기 미역국',
      description: '정갈하고 속 편안한 국물 한 그릇',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 350,
      cookTime: '20분',
      ingredients: ['소고기 한줌', '미역 한줌', '물 국자 4개', '간장 숟가락 1개', '마늘 1쪽'],
      steps: [
        {
          text: '미역을 불리고 소고기를 볶습니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '물을 붓고 미역과 고기를 함께 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '간장과 마늘로 간을 맞춰 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-l-2',
      name: '제육볶음 덮밥',
      description: '달콤하고 매콤한 한 끼 덮밥',
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      calories: 450,
      cookTime: '18분',
      ingredients: ['돼지고기 한줌', '간장 숟가락 1개', '설탕 반숟가락', '고추장 반숟가락', '밥 한공기'],
      steps: [
        {
          text: '돼지고기를 양념에 재워둡니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '양파와 함께 볶아 고기를 익힙니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '밥 위에 올려 덮밥으로 즐깁니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-l-3',
      name: '오므라이스',
      description: '달걀 지단으로 감싼 달콤한 볶음밥',
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      calories: 420,
      cookTime: '16분',
      ingredients: ['밥 한공기', '계란 2개', '케첩 한숟가락', '양파 반개', '햄 한줌'],
      steps: [
        {
          text: '볶음밥을 만들고 케첩으로 볶아줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '달걀 지단을 얇게 부쳐 볶음밥을 감쌉니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '위에 케첩을 뿌려 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-l-4',
      name: '크림 파스타',
      description: '부드럽고 진한 크림 파스타',
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
      calories: 430,
      cookTime: '15분',
      ingredients: ['파스타면 1인분', '생크림 한컵', '베이컨 2줄', '양파 반개', '파슬리 조금'],
      steps: [
        {
          text: '파스타면을 삶아 건져둡니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '베이컨과 양파를 볶고 생크림을 붓습니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '면과 섞어 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-l-5',
      name: '불고기 비빔밥',
      description: '달콤한 불고기와 채소가 어우러진 비빔밥',
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      calories: 440,
      cookTime: '18분',
      ingredients: ['불고기 한줌', '밥 한공기', '채소 한줌', '고추장 한숟가락', '참기름 한숟가락'],
      steps: [
        {
          text: '불고기를 볶아 준비합니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '밥 위에 불고기와 채소를 올립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '고추장과 참기름을 더해 비빔합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-l-6',
      name: '김치 찌개 정식',
      description: '얼큰한 국물이 있는 든든한 점심',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 420,
      cookTime: '20분',
      ingredients: ['김치 두주먹', '돼지고기 손가락 2마디', '두부 반모', '물 국자 4개', '대파 반주먹'],
      steps: [
        {
          text: '김치와 고기를 함께 볶아줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '물을 붓고 두부를 넣어 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '대파를 넣고 한 번 더 끓입니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ],
  dinner: [
    dishTemplate({
      id: 'normal-d-1',
      name: '제육볶음 덮밥',
      description: '매콤하고 든든한 저녁 덮밥',
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      calories: 450,
      cookTime: '18분',
      ingredients: ['돼지고기 한줌', '고추장 반숟가락', '간장 숟가락 1개', '설탕 반숟가락', '밥 한공기'],
      steps: [
        {
          text: '돼지고기를 양념에 재운 뒤 볶습니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 함께 볶아 불향을 낸다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '밥 위에 올려 바로 즐깁니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-d-2',
      name: '갈비탕',
      description: '깊고 진한 한식 국물 요리',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 400,
      cookTime: '25분',
      ingredients: ['소갈비 손가락 2마디', '대파 한줌', '마늘 2쪽', '물 국자 6개', '소금 수저 반개'],
      steps: [
        {
          text: '갈비를 데치고 깨끗이 씻습니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '물을 붓고 갈비를 부드럽게 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '대파와 마늘로 마무리 간을 합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-d-3',
      name: '돈까스 정식',
      description: '겉은 바삭하고 속은 촉촉한 힐링 한 끼',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 480,
      cookTime: '20분',
      ingredients: ['돈까스 한 조각', '양배추 한줌', '소스 한숟가락', '밥 한공기', '레몬 6분의1개'],
      steps: [
        {
          text: '돈까스를 바삭하게 튀깁니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 밥을 함께 플레이팅합니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '소스를 곁들여 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-d-4',
      name: '된장찌개 정식',
      description: '구수하고 진한 맛의 한식 저녁',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 380,
      cookTime: '18분',
      ingredients: ['된장 한숟가락', '두부 반모', '애호박 반개', '대파 한줌', '물 국자 4개'],
      steps: [
        {
          text: '물을 끓여 된장을 풀어줍니다.',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 두부를 넣고 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '대파를 올리고 한 번 더 끓여 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-d-5',
      name: '매운 닭갈비',
      description: '매콤한 양념과 채소가 어우러진 저녁',
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      calories: 460,
      cookTime: '20분',
      ingredients: ['닭다리살 한줌', '고추장 한숟가락', '양배추 한줌', '떡 한줌', '대파 반주먹'],
      steps: [
        {
          text: '양념에 닭고기를 재운 뒤 볶습니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '채소와 떡을 넣고 함께 볶습니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '마무리로 참기름을 더해 냅니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'normal-d-6',
      name: '양념치킨 플레이트',
      description: '달콤한 양념치킨과 샐러드가 함께하는 저녁',
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      calories: 470,
      cookTime: '20분',
      ingredients: ['치킨 한조각', '양념 소스 한숟가락', '양배추 한줌', '감자 한줌', '레몬 6분의1개'],
      steps: [
        {
          text: '치킨을 바삭하게 튀겨 소스를 바릅니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '샐러드와 감자를 곁들입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '레몬을 뿌려 상큼하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ]
}

const soloData = {
  breakfast: [
    dishTemplate({
      id: 'solo-b-1',
      name: '계란밥',
      description: '간단하면서도 든든한 자취생 아침',
      image: 'https://images.unsplash.com/photo-1514516870927-345a23bec818?auto=format&fit=crop&w=900&q=80',
      calories: 280,
      cookTime: '5분',
      ingredients: ['밥 한공기', '계란 1개', '간장 반숟가락', '파 한줌', '참기름 한숟가락'],
      steps: [
        {
          text: '밥 위에 계란을 얹고 간장을 뿌립니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '파와 참기름을 더해 잘 비빕니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '즉시 먹으면 더 맛있습니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-b-2',
      name: '참치 마요 주먹밥',
      description: '간편하게 쥐어먹는 자취식 아침',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 290,
      cookTime: '7분',
      ingredients: ['밥 한공기', '참치 캔 1개', '마요네즈 한숟가락', '김 한장', '파 한줌'],
      steps: [
        {
          text: '참치와 마요네즈를 섞어 밥에 버무립니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '김으로 감싸 주먹밥 모양을 만듭니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '간편하게 한입에 쏙 넣어 드세요.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-b-3',
      name: '햄치즈 토스트',
      description: '간단하고 든든한 자취생 토스트',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 330,
      cookTime: '9분',
      ingredients: ['식빵 2조각', '햄 2조각', '치즈 한장', '버터 한숟가락', '케첩 한숟가락'],
      steps: [
        {
          text: '빵에 버터를 바르고 햄과 치즈를 올립니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '토스트기에 넣어 노릇하게 굽습니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '케첩을 곁들여 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-b-4',
      name: '달걀 샌드위치',
      description: '간편하게 즐기는 계란 샌드',
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80',
      calories: 340,
      cookTime: '10분',
      ingredients: ['식빵 2조각', '계란 2개', '마요네즈 한숟가락', '양상추 한줌', '후추 약간'],
      steps: [
        {
          text: '계란을 삶아 으깬 뒤 마요네즈를 섞습니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '빵에 양상추와 달걀을 올립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '크게 말아 한 입 크기로 나눕니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-b-5',
      name: '치즈 달걀밥',
      description: '한 그릇으로 끝내는 고소한 아침',
      image: 'https://images.unsplash.com/photo-1514516870927-345a23bec818?auto=format&fit=crop&w=900&q=80',
      calories: 350,
      cookTime: '7분',
      ingredients: ['밥 한공기', '계란 1개', '치즈 한줌', '참기름 한숟가락', '파 한줌'],
      steps: [
        {
          text: '밥 위에 계란을 얹고 전자레인지에 데웁니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '치즈를 올려 녹여줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '참기름과 파를 더해 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-b-6',
      name: '토마토 오믈렛',
      description: '새콤달콤한 토마토가 들어간 아침',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80',
      calories: 345,
      cookTime: '9분',
      ingredients: ['계란 2개', '토마토 반개', '양파 조금', '파 한줌', '소금 수저 반개'],
      steps: [
        {
          text: '토마토와 양파를 썰어둡니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '계란물을 붓고 재료를 함께 익힙니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '말아 접시에 담으면 완성입니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ],
  lunch: [
    dishTemplate({
      id: 'solo-l-1',
      name: '김치볶음밥',
      description: '매콤하고 빠른 자취생 대표 메뉴',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 380,
      cookTime: '12분',
      ingredients: ['밥 한공기', '김치 두주먹', '대파 반주먹', '계란 1개', '참기름 한숟가락'],
      steps: [
        {
          text: '팬에 김치와 대파를 볶습니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '밥을 넣고 잘 섞어 볶습니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '계란 프라이를 올려서 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-l-2',
      name: '라면 계란 토핑',
      description: '간단하지만 든든한 자취식 클래식',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
      calories: 380,
      cookTime: '8분',
      ingredients: ['라면 1개', '계란 1개', '물 국자 5개', '파 한줌', '김 한장'],
      steps: [
        {
          text: '물을 끓이고 라면을 넣어 끓입니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '계란과 파를 올려 한 번 더 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '김을 부숴 올려 즐깁니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-l-3',
      name: '참치김밥',
      description: '간편하지만 든든한 한 줄',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 360,
      cookTime: '10분',
      ingredients: ['김 한장', '밥 한공기', '참치 캔 1개', '단무지 한줌', '시금치 한줌'],
      steps: [
        {
          text: '참치와 밥을 섞어 김 위에 올립니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '단무지와 시금치를 함께 넣어 말아줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '한 입 크기로 썰어 서빙합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-l-4',
      name: '참치마요 주먹밥',
      description: '달콤하고 고소한 한입 주먹밥',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 370,
      cookTime: '8분',
      ingredients: ['밥 한공기', '참치 캔 1개', '마요네즈 한숟가락', '김 한장', '파 한줌'],
      steps: [
        {
          text: '참치와 마요네즈를 섞어 밥에 버무립니다.',
          image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '김으로 감싸서 주먹밥을 만듭니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '한 입에 넣기 좋게 나눠냅니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-l-5',
      name: '치즈 볶음밥',
      description: '남은 재료로 빠르게 만드는 치즈 볶음밥',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 390,
      cookTime: '10분',
      ingredients: ['밥 한공기', '치즈 한줌', '양파 반개', '간장 숟가락 1개', '참기름 한숟가락'],
      steps: [
        {
          text: '양파를 볶고 밥과 간장을 넣어 볶아줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '치즈를 넣어 녹여줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '참기름을 더해 고소하게 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-l-6',
      name: '핫사리 치즈 라면',
      description: '매콤한 라면에 치즈를 더한 자취식',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
      calories: 395,
      cookTime: '9분',
      ingredients: ['라면 1개', '치즈 한장', '계란 1개', '물 국자 5개', '파 한줌'],
      steps: [
        {
          text: '라면을 끓이면서 치즈를 준비합니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '면이 익으면 치즈를 올려 녹입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '계란을 추가해 더 풍성하게 만듭니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ],
  dinner: [
    dishTemplate({
      id: 'solo-d-1',
      name: '우육소면',
      description: '가볍지만 깊은 국물 자취 저녁',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
      calories: 350,
      cookTime: '20분',
      ingredients: ['소고기 한줌', '소면 한줌', '간장 숟가락 1개', '마늘 1쪽', '파 한줌'],
      steps: [
        {
          text: '소고기를 볶아 간장으로 간을 합니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '물을 붓고 국물을 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '소면을 삶아 국물과 함께 담습니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-d-2',
      name: '치즈불닭 볶음밥',
      description: '매콤한 볶음밥 위에 치즈가 녹아든 한 끼',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80',
      calories: 410,
      cookTime: '12분',
      ingredients: ['밥 한공기', '불닭 소스 한숟가락', '치즈 한줌', '양파 반개', '파 한줌'],
      steps: [
        {
          text: '밥과 소스, 양파를 볶아줍니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '치즈를 올려 녹입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '파를 뿌려 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-d-3',
      name: '김치 우동',
      description: '얼큰한 김치 국물에 우동을 넣은 자취식',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
      calories: 360,
      cookTime: '12분',
      ingredients: ['우동면 한줌', '김치 두줌', '대파 한줌', '고추장 반숟가락', '물 국자 5개'],
      steps: [
        {
          text: '물을 끓이고 김치를 넣어 얼큰한 국물을 만듭니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '우동면을 넣고 함께 끓입니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '대파를 올려 마무리합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-d-4',
      name: '햄치즈 라면 볶음',
      description: '라면과 햄, 치즈가 어우러진 자취식볶음',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
      calories: 390,
      cookTime: '11분',
      ingredients: ['라면 1개', '햄 한줌', '치즈 한장', '파 한줌', '간장 반숟가락'],
      steps: [
        {
          text: '라면을 삶아 물을 조금 남겨둡니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '햄과 치즈를 넣고 볶아줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '파를 얹고 간장으로 간을 맞춥니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-d-5',
      name: '떡볶이 덮밥',
      description: '떡볶이를 밥과 함께 즐기는 한 그릇',
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=900&q=80',
      calories: 400,
      cookTime: '12분',
      ingredients: ['떡 한줌', '고추장 한숟가락', '양배추 한줌', '어묵 한줌', '파 반주먹'],
      steps: [
        {
          text: '물에 고추장과 채소를 넣고 끓입니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '떡과 어묵을 넣어 함께 졸여줍니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '밥 위에 올려 덮밥으로 즐깁니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    }),
    dishTemplate({
      id: 'solo-d-6',
      name: '달걀 김치볶음밥',
      description: '김치볶음밥 위에 달걀을 얹은 간편 메뉴',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
      calories: 370,
      cookTime: '12분',
      ingredients: ['밥 한공기', '김치 두주먹', '계란 1개', '파 반주먹', '참기름 한숟가락'],
      steps: [
        {
          text: '김치와 밥을 볶아 볶음밥을 만듭니다.',
          image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '달걀 프라이를 올립니다.',
          image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=80'
        },
        {
          text: '참기름을 조금 더해 완성합니다.',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
        }
      ]
    })
  ]
}

const menuMap = {
  '다이어트식': dietData,
  '일반식': normalData,
  '자취식': soloData
}

const decorate = (category, mealType, day, item) => ({
  id: `${item.id}-${day}`,
  category,
  meal: mealType,
  name: `${dayLabel(day)} ${item.baseName}`,
  description: `${dayLabel(day)} ${item.baseDescription}`,
  image: item.image,
  calories: item.calories,
  cookTime: item.cookTime,
  ingredients: item.ingredients,
  steps: item.steps
})

export function getMenuForDate(category, day) {
  const meals = menuMap[category] || dietData
  const idx = (day - 1) % meals.breakfast.length
  return {
    breakfast: decorate(category, '아침', day, meals.breakfast[idx]),
    lunch: decorate(category, '점심', day, meals.lunch[idx]),
    dinner: decorate(category, '저녁', day, meals.dinner[idx])
  }
}

export { categories }
