const roles = [{"faction": "Spaniards", "role": "Mariana", "Character": "Doña Mariana/Malinche", "isLeader": "FALSE"},
		{"faction": "Spaniards", "role": "Alvarado", "Character": "Pedro de Alvarado", "isLeader": "FALSE"},
		{"faction": "Spaniards", "role": "Aguilar", "Character": "Gerónimo de Aguilar", "isLeader": "FALSE"},
		{"faction": "Spaniards", "role": "Garrido", "Character": "Juan Garrido", "isLeader": "FALSE"},
		{"faction": "Spaniards", "role": "Olid", "Character": "Cristóbal de Olid", "isLeader": "FALSE"},
		{"faction": "Aztecs", "role": "Moctezuma", "Character": "Moctezuma", "isLeader": "TRUE"},
		{"faction": "Aztecs", "role": "Tlacaelel", "Character": "Tlacaelel Xocoyotl (aka Tlacaelel the Younger)", "isLeader": "FALSE"},
		{"faction": "Aztecs", "role": "Cuauhtemoc", "Character": "Cuauhtémoc", "isLeader": "FALSE"},
		{"faction": "Aztecs", "role": "Aztec_Priest", "Character": "Aztec Priest", "isLeader": "FALSE"},
		{"faction": "Aztecs", "role": "Cacamatzin", "Character": "Cacamatzín", "isLeader": "FALSE"},
		{"faction": "Aztecs", "role": "Pochteca", "Character": "Pochteca", "isLeader": "FALSE"},
		{"faction": "Tlaxcalans", "role": "Xicotencatl_Elder", "Character": "Xicotencatl the Elder", "isLeader": "TRUE"},
		{"faction": "Tlaxcalans", "role": "Xicotencatl_Younger", "Character": "Xicotencatl the Younger", "isLeader": "FALSE"},
		{"faction": "Tlaxcalans", "role": "Maxixcatl", "Character": "Maxixcatl", "isLeader": "FALSE"}]

const newRoles = {}
for(let i of roles){
    let role = i.role
    delete i["role"] 
    newRoles[role] = i 
}

console.log(JSON.stringify(newRoles, null, 2))
