// Placeholder approval levels data for different menus

export const approvalLevelsDataByMenu: Record<string, {
  maxLevel: number;
  userOptions: { id: string; name: string }[];
  data: { level: number; users: string[]; maxSingle: string; maxDay: string; maxMonth: string }[];
}> = {
  menu1: {
    maxLevel: 2,
    userOptions: [
      { id: "user1", name: "User 1" },
      { id: "user2", name: "User 2" },
      { id: "user3", name: "User 3" },
      { id: "user4", name: "User 4" },
    ],
    data: [
      { level: 1, users: ["user1"], maxSingle: "1000", maxDay: "5000", maxMonth: "20000" },
      { level: 2, users: ["user2", "user3"], maxSingle: "2000", maxDay: "7000", maxMonth: "25000" },
    ]
  },
  menu2: {
    maxLevel: 1,
    userOptions: [
      { id: "user1", name: "User 1" },
      { id: "user2", name: "User 2" },
      { id: "user3", name: "User 3" },
      { id: "user4", name: "User 4" },
    ],
    data: [
      { level: 1, users: ["user4"], maxSingle: "500", maxDay: "2000", maxMonth: "10000" },
    ]
  },
    menu3: {
        maxLevel: 3,
        userOptions: [
        { id: "user1", name: "User 1" },
        { id: "user2", name: "User 2" },
        { id: "user3", name: "User 3" },
        { id: "user4", name: "User 4" },
        ],
        data: [
        { level: 1, users: ["user1"], maxSingle: "1000", maxDay: "5000", maxMonth: "20000" },
        { level: 2, users: ["user2"], maxSingle: "2000", maxDay: "7000", maxMonth: "25000" },
        { level: 3, users: ["user3"], maxSingle: "3000", maxDay: "9000", maxMonth: "30000" },
        ]
    },
    menu4: {
        maxLevel: 2,
        userOptions: [
        { id: "user1", name: "User 1" },
        { id: "user2", name: "User 2" },
        { id: "user3", name: "User 3" },
        { id: "user4", name: "User 4" },
        ],
        data: [
        { level: 1, users: ["user1"], maxSingle: "1000", maxDay: "5000", maxMonth: "20000" },
        { level: 2, users: ["user2"], maxSingle: "2000", maxDay: "7000", maxMonth: "25000" },
        ]
    },
    menu5: {
        maxLevel: 0,
        userOptions: [
        { id: "user1", name: "User 1" },
        { id: "user2", name: "User 2" },
        { id: "user3", name: "User 3" },
        { id: "user4", name: "User 4" },
        ],
        data: [ ]
    }
};


// {
//   "menu2": {
//       "maxLevel": 1,
//       "userOptions": [
//           {
//               "id": "2",
//               "name": "user2@empirejute.com"
//           },
//           {
//               "id": "3",
//               "name": "user3@empirejute.com"
//           },
//           {
//               "id": "6",
//               "name": "test5@empirejute.com"
//           },
//           {
//               "id": "9",
//               "name": "test8@empirejute.com"
//           },
//           {
//               "id": "7",
//               "name": "test6@empirejute.com"
//           },
//           {
//               "id": "1",
//               "name": "user1@empirejute.com"
//           }
//       ],
//       "data": [
//           {
//               "level": 1,
//               "users": [
//                   "1"
//               ],
//               "maxSingle": "500.0",
//               "maxDay": "1000.0",
//               "maxMonth": "1500.0"
//           }
//       ]
//   }
// }
