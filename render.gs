/**
   * onOpen
 */
function onOpen(){
  const menuName = "Extended Exe";
  const objActions = [
    {name: "ListImage by ID row", functionName: "main"}
  ];
  LandmasterLibraryGas.onOpenToAddMenu(menuName, objActions);
}
