// Placeholder dropdown fields data for ApprovalDropdowns
import type { DropdownField } from "@/components/ui/ApprovalDropdowns";

export const dropdownFields: DropdownField[] = [
  {
    id: "company",
    label: "Company",
    items: [
      { id: "company1", name: "Company 1" },
      { id: "company2", name: "Company 2" },
    ]
  },
  {
    id: "branch",
    label: "Branch",
    dependsOn: "company",
    items: {
      "company1": [
        { id: "branch1", name: "Branch 1" },
        { id: "branch2", name: "Branch 2" }
      ],
      "company2": [
        { id: "branch3", name: "Branch 3" },
        { id: "branch4", name: "Branch 4" }
      ]
    }
  },
  {
    id: "menu",
    label: "Menu",
    dependsOn: "branch",
    items: {
      "branch1": [{ id: "menu1", name: "Menu 1" }, { id: "menu2", name: "Menu 2" }],
      "branch2": [{ id: "menu3", name: "Menu 3" }, { id: "menu4", name: "Menu 4" }],
      "branch3": [{ id: "menu5", name: "Menu 5" }, { id: "menu6", name: "Menu 6" }],
      "branch4": [{ id: "menu7", name: "Menu 7" }, { id: "menu8", name: "Menu 8" }]
    }
  }
];
