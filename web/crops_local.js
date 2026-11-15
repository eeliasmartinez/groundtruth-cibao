// National crop directory compiled from ONE's 2025 agriculture bulletin and
// the crop profiles already present in this project.
// Production figures are preliminary 2025 totals in metric tonnes. A null
// figure means the bulletin did not publish a separate total for that crop.
// modelKey only marks crops present in the existing Cibao rotation engine;
// it does not mean that a crop has an independent farm planner.
window.GT_LOCAL_CROPS = [
  {id:"plantain", es:"Plátano", en:"Plantain", group:"musaceae", production:1791650.6},
  {id:"banana", es:"Guineo", en:"Banana", group:"musaceae", production:2186946.3},
  {id:"rice", es:"Arroz", en:"Rice", group:"grain", production:670501.9, modelKey:"rice"},
  {id:"cassava", es:"Yuca", en:"Cassava", group:"roots", production:285017.4},
  {id:"maize", es:"Maíz", en:"Maize", group:"grain", production:94980.6, modelKey:"maize"},
  {id:"red-bean", es:"Habichuela roja", en:"Red bean", group:"legume", modelKey:"beans"},
  {id:"black-bean", es:"Habichuela negra", en:"Black bean", group:"legume", modelKey:"beans"},
  {id:"white-bean", es:"Habichuela blanca", en:"White bean", group:"legume", modelKey:"beans"},
  {id:"pigeon-pea", es:"Guandul", en:"Pigeon pea", group:"legume", modelKey:"pigeon_pea"},
  {id:"cowpea", es:"Caupí", en:"Cowpea", group:"legume", modelKey:"cowpea"},
  {id:"sorghum", es:"Sorgo", en:"Sorghum", group:"grain", modelKey:"sorghum", exportShare:65.2},
  {id:"papaya", es:"Lechosa", en:"Papaya", group:"fruit", production:2100126.7},
  {id:"avocado", es:"Aguacate", en:"Avocado", group:"fruit", production:1337032.8},
  {id:"pineapple", es:"Piña", en:"Pineapple", group:"fruit", production:921335.1},
  {id:"chayote", es:"Tayota", en:"Chayote", group:"vegetable", production:868270.3},
  {id:"watermelon", es:"Sandía", en:"Watermelon", group:"vegetable", production:833353.1},
  {id:"coconut", es:"Coco", en:"Coconut", group:"fruit", production:714571.6},
  {id:"tomato", es:"Tomate industrial", en:"Industrial tomato", group:"vegetable", production:196861.1},
  {id:"sapote", es:"Zapote", en:"Sapote", group:"fruit", production:187235.1},
  {id:"orange", es:"Naranja dulce", en:"Sweet orange", group:"fruit", production:133270.7},
  {id:"potato", es:"Papa", en:"Potato", group:"roots", production:130236.1},
  {id:"onion", es:"Cebolla", en:"Onion", group:"vegetable", production:125292.5},
  {id:"mango", es:"Mango", en:"Mango", group:"fruit", production:120876.0, exportShare:9.7},
  {id:"sweet-potato", es:"Batata", en:"Sweet potato", group:"roots", production:98067.3, exportShare:11.0},
  {id:"lemon", es:"Limón agrio", en:"Lime", group:"fruit", production:94721.3},
  {id:"carrot", es:"Zanahoria", en:"Carrot", group:"vegetable", production:88713.8},
  {id:"squash", es:"Auyama", en:"Squash", group:"vegetable", modelKey:"squash"},
  {id:"green-bean", es:"Vainitas", en:"Green beans", group:"vegetable", exportShare:50.2},
  {id:"tindora", es:"Tindora", en:"Tindora", group:"vegetable", exportShare:29.5},
  {id:"bangana", es:"Bangaña", en:"Bangana", group:"vegetable", exportShare:26.5},
  {id:"pepper", es:"Ajíes", en:"Peppers", group:"vegetable", exportShare:25.2},
  {id:"parvol", es:"Parvol", en:"Parvol", group:"vegetable", exportShare:21.0},
  {id:"celery", es:"Apio", en:"Celery", group:"vegetable", exportShare:7.1},
  {id:"zucchini", es:"Calabacín", en:"Zucchini", group:"vegetable", exportShare:6.6},
  {id:"cacao", es:"Cacao", en:"Cacao", group:"tree-crop"},
  {id:"coffee", es:"Café", en:"Coffee", group:"tree-crop"},
  {id:"tobacco", es:"Tabaco", en:"Tobacco", group:"field-crop"},
  {id:"sugarcane", es:"Caña de azúcar", en:"Sugarcane", group:"field-crop"},
  {id:"sesbania", es:"Sesbania (abono verde)", en:"Sesbania (green manure)", group:"cover", modelKey:"sesbania"}
];
