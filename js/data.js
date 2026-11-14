var TRIP = {
  title: TRIP_CONFIG.title,
  subtitle: TRIP_CONFIG.subtitle,
  travelers: TRIP_CONFIG.travelers,
  legs: [
    {
      id: "depart-pdx",
      location: null,
      date: "Nov 25",
      day: { en: "Wednesday", ja: "水曜日" },
      title: { en: "George and Harue depart Portland", ja: "GeorgeとHarueがポートランドを出発" },
      flights: [
        {
          airline: "Alaska Airlines",
          number: "AS490",
          depart: "PDX 7:22 AM",
          arrive: "SEA TBD",
          duration: "TBD",
          cabin: "Main Cabin"
        },
        {
          airline: "Alaska Airlines",
          number: "AS123",
          depart: "SEA 11:55 AM",
          arrive: "NRT 3:25 PM (+1 day)",
          duration: "10h 30min",
          cabin: "Main Cabin"
        }
      ],
      accommodation: null,
      notes: {
        en: "Fly Portland to Seattle, then connect to the direct flight to Narita. Lands Nov 26.",
        ja: "ポートランドからシアトルへ、成田行きの直行便に乗り継ぎます。11月26日到着。"
      },
      thingsToSee: []
    },
    {
      id: "arrive-tokyo",
      location: { en: "Tokyo", ja: "東京" },
      date: "Nov 26",
      day: { en: "Thursday", ja: "木曜日" },
      title: { en: "Arrive in Tokyo", ja: "東京に到着" },
      flight: null,
      accommodation: {
        name: "AirBnB Ryogoku",
        mapQuery: "東京都墨田区両国2丁目3-10",
        icon: "house",
        details: {
          en: "AirBnB in the Ryogoku area, 2-chome-3-10. Exact address still to be confirmed.",
          ja: "両国エリアのAirBnB、2-chome-3-10。正確な住所は未定です。"
        }
      },
      notes: {
        en: "Land at Narita (NRT) at 3:25 PM. Nov 27 to Dec 6 is still open -- fill in as plans firm up.",
        ja: "成田（NRT）に15時25分到着。11月27日から12月6日までは未定です。"
      },
      thingsToSee: []
    },
    {
      id: "kinshicho-skin-doc",
      location: { en: "Tokyo", ja: "東京" },
      date: "Nov 27",
      day: { en: "Friday", ja: "金曜日" },
      title: { en: "Skin doctor at Kinshicho, dinner in Koshigaya", ja: "錦糸町で皮膚科、越谷で夕食" },
      flight: null,
      event: {
        en: "10:30 AM - Skin doctor appointment at Kinshicho Karugamo Dermatology Clinic.",
        ja: "10:30 - 錦糸町かるがも皮膚科で診察。",
        website: "https://karugamo-hifuka.com/",
        mapQuery: "錦糸町かるがも皮膚科, 東京都墨田区",
        icon: "snake"
      },
      accommodation: null,
      meals: [
        {
          label: { en: "Lunch", ja: "昼食" },
          name: {
            en: "Madai Ramen Mengyo Kinshicho Parco",
            ja: "真鯛らーめん 麺魚 錦糸町パルコ店"
          },
          website: "https://www.mengyo.net/",
          mapQuery: "真鯛らーめん 麺魚 錦糸町パルコ店, 東京都墨田区",
          icon: "bowl"
        }
      ],
      notes: {
        en: "Dinner in Koshigaya, possible onsen afterwards.",
        ja: "夕食は越谷で、その後温泉もあり。"
      },
      thingsToSee: []
    },
    {
      id: "samba-nov29",
      location: { en: "Tokyo", ja: "東京" },
      date: "Nov 29",
      day: { en: "Sunday", ja: "日曜日" },
      title: { en: "Sunday samba at Studio Scout", ja: "日曜はスタジオスカウトでサンバ" },
      flight: null,
      event: {
        en: "10:00 AM - 2:00 PM samba session at Studio Scout, near Kaminakazato Station.",
        ja: "10:00 - 14:00 上中里駅近くのスタジオスカウトでサンバ。",
        website: "http://www.studio-scout.com/",
        mapQuery: "スタジオスカウト, 東京都北区西ケ原1-29-7",
        icon: "drum"
      },
      accommodation: null,
      notes: {
        en: "George dances samba with the group. The rest of the day is unplanned.",
        ja: "Georgeはみんなでサンバ。ほかの時間は未定です。"
      },
      thingsToSee: []
    },
    {
      id: "harue-cancer-center",
      location: { en: "Tokyo", ja: "東京" },
      date: "Nov 30",
      day: { en: "Monday", ja: "月曜日" },
      title: { en: "Harue at the cancer center, dinner at Switch", ja: "Harueはがんセンター、Switchで夕食" },
      flight: null,
      accommodation: null,
      meals: [
        {
          label: { en: "Dinner", ja: "夕食" },
          name: { en: "Switch", ja: "スイッチ" },
          mapQuery: "Switch, 8-chome-13-4 Nishishinjuku, Shinjuku City, Tokyo",
          icon: "bowl"
        }
      ],
      notes: {
        en: "Harue has an appointment at the cancer center. George is free for the day. Dinner together at Switch in Nishishinjuku.",
        ja: "Harueはがんセンターへ受診。Georgeはこの日は自由です。夕食は西新宿のSwitchで一緒に。"
      },
      thingsToSee: []
    },
    {
      id: "dec1-open",
      location: { en: "Tokyo", ja: "東京" },
      date: "Dec 1",
      day: { en: "Tuesday", ja: "火曜日" },
      title: { en: "Evening samba and Harue's dinner with friends", ja: "夕方のサンバとHarueの友人との夕食" },
      flight: null,
      event: {
        en: "8:00 PM - 10:00 PM samba session at Studio Scout, near Kaminakazato Station.",
        ja: "20:00 - 22:00 上中里駅近くのスタジオスカウトでサンバ。",
        website: "http://www.studio-scout.com/",
        mapQuery: "スタジオスカウト, 東京都北区西ケ原1-29-7",
        icon: "drum"
      },
      accommodation: null,
      notes: {
        en: "Harue has dinner with friends. The rest of the day stays open.",
        ja: "Harueは友人と夕食。ほかの時間は空きです。"
      },
      thingsToSee: []
    },
    {
      id: "hakone-onsen",
      location: { en: "Hakone", ja: "箱根" },
      date: "Dec 2 - Dec 3",
      day: { en: "Wednesday - Thursday", ja: "水曜日 - 木曜日" },
      title: { en: "Hakone onsen with mom and dad", ja: "母と父と箱根温泉" },
      flight: null,
      accommodation: {
        name: "Senkyoro",
        website: "https://senkyoro.co.jp/",
        details: {
          en: "Sengokuhara ryokan with a milky white sulfur spring. Check-in 3:00 PM.",
          ja: "仙石原の旅館。白濁の源泉かけ流し。チェックイン15:00。"
        }
      },
      notes: {
        en: "Two nights soaking in the onsen with mom and dad. Dec 4 and Dec 5 are still open.",
        ja: "母と父と温泉で2泊。12月4日と5日はまだ空きです。"
      },
      thingsToSee: [
        {
          name: { en: "Sengokuhara Susuki Grass Field", ja: "仙石原すすき草原" },
          info: { en: "Silver grass meadow on the plateau next to the ryokan.", ja: "旅館のそばの高原にあるすすき草原。" }
        },
        {
          name: { en: "Owakudani", ja: "大涌谷" },
          info: { en: "Volcanic valley of steaming vents, famous for its black eggs.", ja: "噴煙が立ち上る火山谷。黒たまごが名物。" }
        },
        {
          name: { en: "Lake Ashi", ja: "芦ノ湖" },
          info: { en: "Crater lake with sightseeing cruises and views of Mt. Fuji.", ja: "遊覧船と富士山の眺めで知られる火口湖。" }
        },
        {
          name: { en: "Pola Museum of Art", ja: "ポーラ美術館" },
          info: { en: "Art museum in the forest near Sengokuhara, with a cafe.", ja: "仙石原近くの森の中の美術館。カフェあり。" }
        },
        {
          name: { en: "Hakone Open-Air Museum", ja: "箱根彫刻の森美術館" },
          info: { en: "Sculpture park opened in 1970, with a Picasso pavilion.", ja: "1970年開館の野外美術館。ピカソ館あり。" }
        },
        {
          name: { en: "Hakone Shrine", ja: "箱根神社" },
          info: { en: "Shrine on the Lake Ashi shore, known for its vermilion torii.", ja: "芦ノ湖のほとりの神社。朱色の鳥居で知られる。" }
        },
        {
          name: { en: "Choan-ji", ja: "長安寺" },
          info: { en: "Zen temple founded in 1658 in the Sengokuhara highlands.", ja: "仙石原にある禅寺。1658年創建。" }
        }
      ]
    },
    {
      id: "dec6-oregon-party",
      location: { en: "Tokyo", ja: "東京" },
      date: "Dec 6",
      day: { en: "Sunday", ja: "日曜日" },
      title: { en: "Oregon team party at Pedro's in Jiyugaoka", ja: "自由が丘のPedro'sでオレゴンチームのパーティー" },
      flight: null,
      event: {
        en: "Oregon team party at Pedro's house, near Jiyugaoka Station (Meguro City). Time to be confirmed.",
        ja: "自由が丘駅近く（目黒区）のPedro's宅でオレゴンチームのパーティー。時間未定。",
        mapQuery: "Jiyugaoka Station, Tokyo"
      },
      accommodation: null,
      notes: {
        en: "Harue is with the Oregon team at Pedro's house in Jiyugaoka.",
        ja: "Harueは自由が丘のPedro's宅でオレゴンチームと一緒です。"
      },
      thingsToSee: []
    },
    {
      id: "george-return",
      location: null,
      date: "Dec 7",
      day: { en: "Monday", ja: "月曜日" },
      title: { en: "George flies home", ja: "Georgeが帰国" },
      flights: [
        {
          airline: "Alaska Airlines",
          number: "AS124",
          depart: "NRT 5:25 PM",
          arrive: "SEA TBD",
          duration: "TBD",
          cabin: "Main Cabin"
        },
        {
          airline: "Alaska Airlines",
          number: "AS488",
          depart: "SEA 12:25 PM",
          arrive: "PDX 1:28 PM",
          duration: "1h 03min",
          cabin: "Main Cabin"
        }
      ],
      accommodation: null,
      notes: {
        en: "George heads home. Harue stays on in Japan until Dec 13.",
        ja: "Georgeは帰国。Harueは12月13日まで日本に滞在します。"
      },
      thingsToSee: []
    },
    {
      id: "harue-return",
      location: null,
      date: "Dec 13",
      day: { en: "Sunday", ja: "日曜日" },
      title: { en: "Harue flies home", ja: "Harueが帰国" },
      flights: [
        {
          airline: "Alaska Airlines",
          number: "AS124",
          depart: "NRT 5:25 PM",
          arrive: "SEA TBD",
          duration: "TBD",
          cabin: "Main Cabin"
        },
        {
          airline: "Alaska Airlines",
          number: "AS488",
          depart: "SEA 12:25 PM",
          arrive: "PDX 1:28 PM",
          duration: "1h 03min",
          cabin: "Main Cabin"
        }
      ],
      accommodation: null,
      notes: {
        en: "Same flights as George's return, one week later. Last leg of the trip.",
        ja: "Georgeの帰りと同じ便、1週間後。旅行の最終便です。"
      },
      thingsToSee: []
    }
  ],
  busyDays: []
};
