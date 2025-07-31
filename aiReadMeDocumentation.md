Documentation for AI ReadMe


Components to use 

1. MUIDataGrid, this is to be used for table dislpays and is in /src/components/ui/MuiDataGrid.tsx

2. to call apis use /src/utils/apciClient2.ts . this is to be used for all api calls and has the get, put, post and delete methods.

3. 

In /itemMaster/page.tsx , 
using itemGroupMaster/page.tsx as reference, and using 1.fetchwithcookies for calling the api route
2.  and using api GET_ITEM_TABLE from api.ts 
3. make the page with a searchable muifrid table from muiDataGrid.tsx (dont change anything here)

this should display the ouput from the api in the data grid with other functionality and create option similar to the way it is done for itemGroupMaster/page.tsx 