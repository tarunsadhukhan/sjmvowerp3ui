// Placeholder approval levels data for different menus

export const approvalLevelsDataByMenu: Record<string, {
  maxLevel: number;
  userOptions: { id: string; name: string }[];
  data: { users: string[]; maxSingle: string; maxDay: string; maxMonth: string }[];
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
      { users: ["user1"], maxSingle: "1000", maxDay: "5000", maxMonth: "20000" },
      { users: ["user2", "user3"], maxSingle: "2000", maxDay: "7000", maxMonth: "25000" },
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
      { users: ["user4"], maxSingle: "0", maxDay: "0", maxMonth: "0" },
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
        { users: ["user1"], maxSingle: "1500", maxDay: "6000", maxMonth: "30000" },
        { users: ["user2"], maxSingle: "2500", maxDay: "8000", maxMonth: "35000" },
        { users: ["user3"], maxSingle: "3000", maxDay: "9000", maxMonth: "40000" },
        ]
    }

};
