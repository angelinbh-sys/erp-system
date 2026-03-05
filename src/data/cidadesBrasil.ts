// Brazilian cities organized by state (capitals + major cities, ALL MG municipalities)
interface CidadeEstado {
  cidade: string;
  estado: string;
  uf: string;
}

// All 853 municipalities of Minas Gerais
const municipiosMG: string[] = [
  "Abaeté","Abre Campo","Acaiaca","Açucena","Água Boa","Água Comprida","Aguanil","Águas Formosas","Águas Vermelhas","Aimorés","Aiuruoca","Alagoa","Albertina","Além Paraíba","Alfenas","Alfredo Vasconcelos","Almenara","Alpercata","Alpinópolis","Alterosa","Alto Caparaó","Alto Jequitibá","Alto Rio Doce","Alvarenga","Alvinópolis","Alvorada de Minas","Amparo do Serra","Andradas","Andrelândia","Angelândia","Antônio Carlos","Antônio Dias","Antônio Prado de Minas","Araçaí","Aracitaba","Araçuaí","Araguari","Arantina","Araponga","Araporã","Arapuá","Araújos","Araxá","Arceburgo","Arcos","Areado","Argirita","Aricanduva","Arinos","Astolfo Dutra","Ataléia","Augusto de Lima","Baependi","Baldim","Bambuí","Bandeira","Bandeira do Sul","Barão de Cocais","Barão do Monte Alto","Barbacena","Barra Longa","Barroso","Bela Vista de Minas","Belmiro Braga","Belo Horizonte","Belo Oriente","Belo Vale","Berilo","Berizal","Bertópolis","Betim","Bias Fortes","Bicas","Biquinhas","Boa Esperança","Bocaina de Minas","Bocaiúva","Bom Despacho","Bom Jardim de Minas","Bom Jesus da Penha","Bom Jesus do Amparo","Bom Jesus do Galho","Bom Repouso","Bom Sucesso","Bonfim","Bonfinópolis de Minas","Bonito de Minas","Borda da Mata","Botelhos","Botumirim","Brás Pires","Brasilândia de Minas","Brasília de Minas","Braúnas","Brazópolis","Brumadinho","Bueno Brandão","Buenópolis","Bugre","Buritis","Buritizeiro","Cabeceira Grande","Cabo Verde","Cachoeira Dourada","Cachoeira da Prata","Cachoeira de Minas","Cachoeira de Pajeú","Caetanópolis","Caeté","Caiana","Cajuri","Caldas","Camacho","Camanducaia","Cambuí","Cambuquira","Campanário","Campanha","Campestre","Campina Verde","Campo Azul","Campo Belo","Campo Florido","Campo do Meio","Campos Altos","Campos Gerais","Cana Verde","Canaã","Canápolis","Candeias","Cantagalo","Caparaó","Capela Nova","Capelinha","Capetinga","Capim Branco","Capinópolis","Capitão Andrade","Capitão Enéas","Capitólio","Caputira","Caraí","Caranaíba","Carandaí","Carangola","Caratinga","Carbonita","Careaçu","Carlos Chagas","Carmésia","Carmo da Cachoeira","Carmo da Mata","Carmo de Minas","Carmo do Cajuru","Carmo do Paranaíba","Carmo do Rio Claro","Carmópolis de Minas","Carneirinho","Carrancas","Carvalhópolis","Carvalhos","Casa Grande","Cascalho Rico","Cássia","Cataguases","Catas Altas","Catas Altas da Noruega","Catuji","Catuti","Caxambu","Cedro do Abaeté","Central de Minas","Centralina","Chácara","Chalé","Chapada Gaúcha","Chapada do Norte","Chiador","Cipotânea","Claraval","Claro dos Poções","Cláudio","Coimbra","Coluna","Comendador Gomes","Comercinho","Conceição da Aparecida","Conceição da Barra de Minas","Conceição das Alagoas","Conceição das Pedras","Conceição de Ipanema","Conceição do Mato Dentro","Conceição do Pará","Conceição do Rio Verde","Conceição dos Ouros","Cônego Marinho","Confins","Congonhal","Congonhas","Congonhas do Norte","Conquista","Conselheiro Lafaiete","Conselheiro Pena","Consolação","Contagem","Coqueiral","Coração de Jesus","Cordisburgo","Cordislândia","Corinto","Coroaci","Coromandel","Coronel Fabriciano","Coronel Murta","Coronel Pacheco","Coronel Xavier Chaves","Córrego Danta","Córrego Fundo","Córrego Novo","Córrego do Bom Jesus","Couto de Magalhães de Minas","Crisólita","Cristais","Cristália","Cristiano Otoni","Cristina","Crucilândia","Cruzeiro da Fortaleza","Cruzília","Cuparaque","Curral de Dentro","Curvelo","Datas","Delfim Moreira","Delfinópolis","Delta","Descoberto","Desterro de Entre Rios","Desterro do Melo","Diamantina","Diogo de Vasconcelos","Dionísio","Divinésia","Divino","Divino das Laranjeiras","Divinolândia de Minas","Divinópolis","Divisa Alegre","Divisa Nova","Divisópolis","Dom Bosco","Dom Cavati","Dom Joaquim","Dom Silvério","Dom Viçoso","Dona Euzébia","Dores de Campos","Dores de Guanhães","Dores do Indaiá","Dores do Turvo","Doresópolis","Douradoquara","Durandé","Elói Mendes","Engenheiro Caldas","Engenheiro Navarro","Entre Folhas","Entre Rios de Minas","Ervália","Esmeraldas","Espera Feliz","Espinosa","Espírito Santo do Dourado","Estiva","Estrela Dalva","Estrela do Indaiá","Estrela do Sul","Eugenópolis","Ewbank da Câmara","Extrema","Fama","Faria Lemos","Felício dos Santos","Felisburgo","Felixlândia","Fernandes Tourinho","Ferros","Fervedouro","Florestal","Formiga","Formoso","Fortaleza de Minas","Fortuna de Minas","Francisco Badaró","Francisco Dumont","Francisco Sá","Franciscópolis","Frei Gaspar","Frei Inocêncio","Frei Lagonegro","Fronteira","Fronteira dos Vales","Fruta de Leite","Frutal","Funilândia","Galiléia","Gameleiras","Glaucilândia","Goiabeira","Goianá","Gonçalves","Gonzaga","Gouveia","Governador Valadares","Grão Mogol","Grupiara","Guanhães","Guapé","Guaraciaba","Guaraciama","Guaranésia","Guarani","Guarará","Guarda-Mor","Guaxupé","Guidoval","Guimarânia","Guiricema","Gurinhatã","Heliodora","Iapu","Ibertioga","Ibiá","Ibiaí","Ibiracatu","Ibiraci","Ibirité","Ibitiúra de Minas","Ibituruna","Icaraí de Minas","Igarapé","Igaratinga","Iguatama","Ijaci","Ilicínea","Imbé de Minas","Inconfidentes","Indaiabira","Indianópolis","Ingaí","Inhapim","Inhaúma","Inimutaba","Ipaba","Ipanema","Ipatinga","Ipiaçu","Ipuiúna","Iraí de Minas","Itabira","Itabirinha","Itabirito","Itacambira","Itacarambi","Itaguara","Itaipé","Itajubá","Itamarandiba","Itamarati de Minas","Itambacuri","Itambé do Mato Dentro","Itamogi","Itamonte","Itanhandu","Itanhomi","Itaobim","Itapagipe","Itapecerica","Itapeva","Itatiaiuçu","Itaú de Minas","Itaúna","Itaverava","Itinga","Itueta","Ituiutaba","Itumirim","Iturama","Itutinga","Jaboticatubas","Jacinto","Jacuí","Jacutinga","Jaguaraçu","Jaíba","Jampruca","Janaúba","Januária","Japaraíba","Japonvar","Jeceaba","Jenipapo de Minas","Jequeri","Jequitaí","Jequitibá","Jequitinhonha","Jesuânia","Joaíma","Joanésia","João Monlevade","João Pinheiro","Joaquim Felício","Jordânia","José Gonçalves de Minas","José Raydan","Josenópolis","Juatuba","Juiz de Fora","Juramento","Juruaia","Juvenília","Ladainha","Lagamar","Lagoa Dourada","Lagoa Formosa","Lagoa Grande","Lagoa Santa","Lagoa da Prata","Lagoa dos Patos","Lajinha","Lambari","Lamim","Laranjal","Lassance","Lavras","Leandro Ferreira","Leme do Prado","Leopoldina","Liberdade","Lima Duarte","Limeira do Oeste","Lontra","Luisburgo","Luislândia","Luminárias","Luz","Machacalis","Machado","Madre de Deus de Minas","Malacacheta","Mamonas","Manga","Manhuaçu","Manhumirim","Mantena","Mar de Espanha","Maravilhas","Maria da Fé","Mariana","Marilac","Mário Campos","Maripá de Minas","Marliéria","Marmelópolis","Martinho Campos","Martins Soares","Mata Verde","Materlândia","Mateus Leme","Mathias Lobato","Matias Barbosa","Matias Cardoso","Matipó","Mato Verde","Matozinhos","Matutina","Medeiros","Medina","Mendes Pimentel","Mercês","Mesquita","Minas Novas","Minduri","Mirabela","Miradouro","Miraí","Miravânia","Moeda","Moema","Monjolos","Monsenhor Paulo","Montalvânia","Monte Alegre de Minas","Monte Azul","Monte Belo","Monte Carmelo","Monte Formoso","Monte Santo de Minas","Monte Sião","Montes Claros","Montezuma","Morada Nova de Minas","Morro da Garça","Morro do Pilar","Munhoz","Muriaé","Mutum","Muzambinho","Nacip Raydan","Nanuque","Naque","Natalândia","Natércia","Nazareno","Nepomuceno","Ninheira","Nova Belém","Nova Era","Nova Lima","Nova Módica","Nova Ponte","Nova Porteirinha","Nova Resende","Nova Serrana","Nova União","Novo Cruzeiro","Novo Oriente de Minas","Novorizonte","Olaria","Olhos-d'Água","Olímpio Noronha","Oliveira","Oliveira Fortes","Onça de Pitangui","Oratórios","Orizânia","Ouro Branco","Ouro Fino","Ouro Preto","Ouro Verde de Minas","Padre Carvalho","Padre Paraíso","Pai Pedro","Paineiras","Pains","Paiva","Palma","Palmópolis","Papagaios","Pará de Minas","Paracatu","Paraguaçu","Paraisópolis","Paraopeba","Passa Quatro","Passa Tempo","Passa Vinte","Passabém","Passos","Patis","Patos de Minas","Patrocínio","Patrocínio do Muriaé","Paula Cândido","Paulistas","Pavão","Peçanha","Pedra Azul","Pedra Bonita","Pedra Dourada","Pedra do Anta","Pedra do Indaiá","Pedralva","Pedras de Maria da Cruz","Pedrinópolis","Pedro Leopoldo","Pedro Teixeira","Pequeri","Pequi","Perdigão","Perdizes","Perdões","Periquito","Pescador","Piau","Piedade de Caratinga","Piedade de Ponte Nova","Piedade do Rio Grande","Piedade dos Gerais","Pimenta","Pingo-d'Água","Pintópolis","Piracema","Pirajuba","Piranga","Piranguçu","Piranguinho","Pirapetinga","Pirapora","Piraúba","Pitangui","Piumhi","Planura","Poço Fundo","Poços de Caldas","Pocrane","Pompéu","Ponte Nova","Ponto Chique","Ponto dos Volantes","Porteirinha","Porto Firme","Poté","Pouso Alegre","Pouso Alto","Prados","Prata","Pratápolis","Pratinha","Presidente Bernardes","Presidente Juscelino","Presidente Kubitschek","Presidente Olegário","Prudente de Morais","Quartel Geral","Queluzito","Raposos","Raul Soares","Recreio","Reduto","Resende Costa","Resplendor","Ressaquinha","Riachinho","Riacho dos Machados","Ribeirão Vermelho","Ribeirão das Neves","Rio Acima","Rio Casca","Rio Doce","Rio Espera","Rio Manso","Rio Novo","Rio Paranaíba","Rio Pardo de Minas","Rio Piracicaba","Rio Pomba","Rio Preto","Rio Vermelho","Rio do Prado","Ritápolis","Rochedo de Minas","Rodeiro","Romaria","Rosário da Limeira","Rubelita","Rubim","Sabará","Sabinópolis","Sacramento","Salinas","Salto da Divisa","Santa Bárbara","Santa Bárbara do Leste","Santa Bárbara do Monte Verde","Santa Bárbara do Tugúrio","Santa Cruz de Minas","Santa Cruz de Salinas","Santa Cruz do Escalvado","Santa Efigênia de Minas","Santa Fé de Minas","Santa Helena de Minas","Santa Juliana","Santa Luzia","Santa Margarida","Santa Maria de Itabira","Santa Maria do Salto","Santa Maria do Suaçuí","Santa Rita de Caldas","Santa Rita de Ibitipoca","Santa Rita de Jacutinga","Santa Rita de Minas","Santa Rita do Itueto","Santa Rita do Sapucaí","Santa Rosa da Serra","Santa Vitória","Santana da Vargem","Santana de Cataguases","Santana de Pirapama","Santana do Deserto","Santana do Garambéu","Santana do Jacaré","Santana do Manhuaçu","Santana do Paraíso","Santana do Riacho","Santana dos Montes","Santo Antônio do Amparo","Santo Antônio do Aventureiro","Santo Antônio do Grama","Santo Antônio do Itambé","Santo Antônio do Jacinto","Santo Antônio do Monte","Santo Antônio do Retiro","Santo Antônio do Rio Abaixo","Santo Hipólito","Santos Dumont","São Bento Abade","São Brás do Suaçuí","São Domingos das Dores","São Domingos do Prata","São Félix de Minas","São Francisco","São Francisco de Paula","São Francisco de Sales","São Francisco do Glória","São Geraldo","São Geraldo da Piedade","São Geraldo do Baixio","São Gonçalo do Abaeté","São Gonçalo do Pará","São Gonçalo do Rio Abaixo","São Gonçalo do Rio Preto","São Gonçalo do Sapucaí","São Gotardo","São João Batista do Glória","São João Evangelista","São João Nepomuceno","São João da Lagoa","São João da Mata","São João da Ponte","São João das Missões","São João del Rei","São João do Manhuaçu","São João do Manteninha","São João do Oriente","São João do Pacuí","São João do Paraíso","São Joaquim de Bicas","São José da Barra","São José da Lapa","São José da Safira","São José da Varginha","São José do Alegre","São José do Divino","São José do Goiabal","São José do Jacuri","São José do Mantimento","São Lourenço","São Miguel do Anta","São Pedro da União","São Pedro do Suaçuí","São Pedro dos Ferros","São Romão","São Roque de Minas","São Sebastião da Bela Vista","São Sebastião da Vargem Alegre","São Sebastião do Anta","São Sebastião do Maranhão","São Sebastião do Oeste","São Sebastião do Paraíso","São Sebastião do Rio Preto","São Sebastião do Rio Verde","São Tiago","São Tomás de Aquino","São Tomé das Letras","São Vicente de Minas","Sapucaí-Mirim","Sardoá","Sarzedo","Sem-Peixe","Senador Amaral","Senador Cortes","Senador Firmino","Senador José Bento","Senador Modestino Gonçalves","Senhora de Oliveira","Senhora do Porto","Senhora dos Remédios","Sericita","Seritinga","Serra Azul de Minas","Serra da Saudade","Serra do Salitre","Serra dos Aimorés","Serrania","Serranópolis de Minas","Serranos","Serro","Sete Lagoas","Setubinha","Silveirânia","Silvianópolis","Simão Pereira","Simonésia","Sobrália","Soledade de Minas","Tabuleiro","Taiobeiras","Taparuba","Tapira","Tapiraí","Taquaraçu de Minas","Tarumirim","Teixeiras","Teófilo Otoni","Timóteo","Tiradentes","Tiros","Tocantins","Tocos do Moji","Toledo","Tombos","Três Corações","Três Marias","Três Pontas","Tumiritinga","Tupaciguara","Turmalina","Turvolândia","Ubá","Ubaí","Ubaporanga","Uberaba","Uberlândia","Umburatiba","Unaí","União de Minas","Uruana de Minas","Urucânia","Urucuia","Vargem Alegre","Vargem Bonita","Vargem Grande do Rio Pardo","Varginha","Varjão de Minas","Várzea da Palma","Varzelândia","Vazante","Verdelândia","Veredinha","Veríssimo","Vermelho Novo","Vespasiano","Viçosa","Vieiras","Virgem da Lapa","Virgínia","Virginópolis","Virgolândia","Visconde do Rio Branco","Volta Grande","Wenceslau Braz"
];

const otherCities: CidadeEstado[] = [
  // Acre
  { cidade: "Rio Branco", estado: "Acre", uf: "AC" },
  { cidade: "Cruzeiro do Sul", estado: "Acre", uf: "AC" },
  // Alagoas
  { cidade: "Maceió", estado: "Alagoas", uf: "AL" },
  { cidade: "Arapiraca", estado: "Alagoas", uf: "AL" },
  // Amapá
  { cidade: "Macapá", estado: "Amapá", uf: "AP" },
  { cidade: "Santana", estado: "Amapá", uf: "AP" },
  // Amazonas
  { cidade: "Manaus", estado: "Amazonas", uf: "AM" },
  { cidade: "Parintins", estado: "Amazonas", uf: "AM" },
  // Bahia
  { cidade: "Salvador", estado: "Bahia", uf: "BA" },
  { cidade: "Feira de Santana", estado: "Bahia", uf: "BA" },
  { cidade: "Vitória da Conquista", estado: "Bahia", uf: "BA" },
  { cidade: "Camaçari", estado: "Bahia", uf: "BA" },
  { cidade: "Ilhéus", estado: "Bahia", uf: "BA" },
  { cidade: "Juazeiro", estado: "Bahia", uf: "BA" },
  { cidade: "Lauro de Freitas", estado: "Bahia", uf: "BA" },
  { cidade: "Itabuna", estado: "Bahia", uf: "BA" },
  // Ceará
  { cidade: "Fortaleza", estado: "Ceará", uf: "CE" },
  { cidade: "Caucaia", estado: "Ceará", uf: "CE" },
  { cidade: "Juazeiro do Norte", estado: "Ceará", uf: "CE" },
  { cidade: "Maracanaú", estado: "Ceará", uf: "CE" },
  { cidade: "Sobral", estado: "Ceará", uf: "CE" },
  // Distrito Federal
  { cidade: "Brasília", estado: "Distrito Federal", uf: "DF" },
  // Espírito Santo
  { cidade: "Vitória", estado: "Espírito Santo", uf: "ES" },
  { cidade: "Vila Velha", estado: "Espírito Santo", uf: "ES" },
  { cidade: "Serra", estado: "Espírito Santo", uf: "ES" },
  { cidade: "Cariacica", estado: "Espírito Santo", uf: "ES" },
  // Goiás
  { cidade: "Goiânia", estado: "Goiás", uf: "GO" },
  { cidade: "Aparecida de Goiânia", estado: "Goiás", uf: "GO" },
  { cidade: "Anápolis", estado: "Goiás", uf: "GO" },
  { cidade: "Rio Verde", estado: "Goiás", uf: "GO" },
  // Maranhão
  { cidade: "São Luís", estado: "Maranhão", uf: "MA" },
  { cidade: "Imperatriz", estado: "Maranhão", uf: "MA" },
  { cidade: "Timon", estado: "Maranhão", uf: "MA" },
  // Mato Grosso
  { cidade: "Cuiabá", estado: "Mato Grosso", uf: "MT" },
  { cidade: "Várzea Grande", estado: "Mato Grosso", uf: "MT" },
  { cidade: "Rondonópolis", estado: "Mato Grosso", uf: "MT" },
  { cidade: "Sinop", estado: "Mato Grosso", uf: "MT" },
  // Mato Grosso do Sul
  { cidade: "Campo Grande", estado: "Mato Grosso do Sul", uf: "MS" },
  { cidade: "Dourados", estado: "Mato Grosso do Sul", uf: "MS" },
  { cidade: "Três Lagoas", estado: "Mato Grosso do Sul", uf: "MS" },
  // Pará
  { cidade: "Belém", estado: "Pará", uf: "PA" },
  { cidade: "Ananindeua", estado: "Pará", uf: "PA" },
  { cidade: "Santarém", estado: "Pará", uf: "PA" },
  { cidade: "Marabá", estado: "Pará", uf: "PA" },
  // Paraíba
  { cidade: "João Pessoa", estado: "Paraíba", uf: "PB" },
  { cidade: "Campina Grande", estado: "Paraíba", uf: "PB" },
  // Paraná
  { cidade: "Curitiba", estado: "Paraná", uf: "PR" },
  { cidade: "Londrina", estado: "Paraná", uf: "PR" },
  { cidade: "Maringá", estado: "Paraná", uf: "PR" },
  { cidade: "Ponta Grossa", estado: "Paraná", uf: "PR" },
  { cidade: "Cascavel", estado: "Paraná", uf: "PR" },
  { cidade: "São José dos Pinhais", estado: "Paraná", uf: "PR" },
  { cidade: "Foz do Iguaçu", estado: "Paraná", uf: "PR" },
  // Pernambuco
  { cidade: "Recife", estado: "Pernambuco", uf: "PE" },
  { cidade: "Jaboatão dos Guararapes", estado: "Pernambuco", uf: "PE" },
  { cidade: "Olinda", estado: "Pernambuco", uf: "PE" },
  { cidade: "Caruaru", estado: "Pernambuco", uf: "PE" },
  { cidade: "Petrolina", estado: "Pernambuco", uf: "PE" },
  // Piauí
  { cidade: "Teresina", estado: "Piauí", uf: "PI" },
  { cidade: "Parnaíba", estado: "Piauí", uf: "PI" },
  // Rio de Janeiro
  { cidade: "Rio de Janeiro", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "São Gonçalo", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Duque de Caxias", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Nova Iguaçu", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Niterói", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Belford Roxo", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Campos dos Goytacazes", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Petrópolis", estado: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Volta Redonda", estado: "Rio de Janeiro", uf: "RJ" },
  // Rio Grande do Norte
  { cidade: "Natal", estado: "Rio Grande do Norte", uf: "RN" },
  { cidade: "Mossoró", estado: "Rio Grande do Norte", uf: "RN" },
  { cidade: "Parnamirim", estado: "Rio Grande do Norte", uf: "RN" },
  // Rio Grande do Sul
  { cidade: "Porto Alegre", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "Caxias do Sul", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "Pelotas", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "Canoas", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "Santa Maria", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "Gravataí", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "Novo Hamburgo", estado: "Rio Grande do Sul", uf: "RS" },
  { cidade: "São Leopoldo", estado: "Rio Grande do Sul", uf: "RS" },
  // Rondônia
  { cidade: "Porto Velho", estado: "Rondônia", uf: "RO" },
  { cidade: "Ji-Paraná", estado: "Rondônia", uf: "RO" },
  // Roraima
  { cidade: "Boa Vista", estado: "Roraima", uf: "RR" },
  // Santa Catarina
  { cidade: "Florianópolis", estado: "Santa Catarina", uf: "SC" },
  { cidade: "Joinville", estado: "Santa Catarina", uf: "SC" },
  { cidade: "Blumenau", estado: "Santa Catarina", uf: "SC" },
  { cidade: "São José", estado: "Santa Catarina", uf: "SC" },
  { cidade: "Chapecó", estado: "Santa Catarina", uf: "SC" },
  { cidade: "Criciúma", estado: "Santa Catarina", uf: "SC" },
  { cidade: "Itajaí", estado: "Santa Catarina", uf: "SC" },
  // São Paulo
  { cidade: "São Paulo", estado: "São Paulo", uf: "SP" },
  { cidade: "Guarulhos", estado: "São Paulo", uf: "SP" },
  { cidade: "Campinas", estado: "São Paulo", uf: "SP" },
  { cidade: "São Bernardo do Campo", estado: "São Paulo", uf: "SP" },
  { cidade: "Santo André", estado: "São Paulo", uf: "SP" },
  { cidade: "São José dos Campos", estado: "São Paulo", uf: "SP" },
  { cidade: "Osasco", estado: "São Paulo", uf: "SP" },
  { cidade: "Ribeirão Preto", estado: "São Paulo", uf: "SP" },
  { cidade: "Sorocaba", estado: "São Paulo", uf: "SP" },
  { cidade: "Santos", estado: "São Paulo", uf: "SP" },
  { cidade: "Mauá", estado: "São Paulo", uf: "SP" },
  { cidade: "São José do Rio Preto", estado: "São Paulo", uf: "SP" },
  { cidade: "Mogi das Cruzes", estado: "São Paulo", uf: "SP" },
  { cidade: "Diadema", estado: "São Paulo", uf: "SP" },
  { cidade: "Jundiaí", estado: "São Paulo", uf: "SP" },
  { cidade: "Piracicaba", estado: "São Paulo", uf: "SP" },
  { cidade: "Carapicuíba", estado: "São Paulo", uf: "SP" },
  { cidade: "Bauru", estado: "São Paulo", uf: "SP" },
  { cidade: "Itaquaquecetuba", estado: "São Paulo", uf: "SP" },
  { cidade: "São Vicente", estado: "São Paulo", uf: "SP" },
  { cidade: "Franca", estado: "São Paulo", uf: "SP" },
  { cidade: "Praia Grande", estado: "São Paulo", uf: "SP" },
  { cidade: "Guarujá", estado: "São Paulo", uf: "SP" },
  { cidade: "Taubaté", estado: "São Paulo", uf: "SP" },
  { cidade: "Limeira", estado: "São Paulo", uf: "SP" },
  { cidade: "Suzano", estado: "São Paulo", uf: "SP" },
  { cidade: "Taboão da Serra", estado: "São Paulo", uf: "SP" },
  { cidade: "Sumaré", estado: "São Paulo", uf: "SP" },
  { cidade: "Barueri", estado: "São Paulo", uf: "SP" },
  { cidade: "Embu das Artes", estado: "São Paulo", uf: "SP" },
  { cidade: "Indaiatuba", estado: "São Paulo", uf: "SP" },
  { cidade: "Cotia", estado: "São Paulo", uf: "SP" },
  { cidade: "Americana", estado: "São Paulo", uf: "SP" },
  { cidade: "Marília", estado: "São Paulo", uf: "SP" },
  { cidade: "Araraquara", estado: "São Paulo", uf: "SP" },
  { cidade: "Presidente Prudente", estado: "São Paulo", uf: "SP" },
  { cidade: "Jacareí", estado: "São Paulo", uf: "SP" },
  { cidade: "Hortolândia", estado: "São Paulo", uf: "SP" },
  // Sergipe
  { cidade: "Aracaju", estado: "Sergipe", uf: "SE" },
  { cidade: "Nossa Senhora do Socorro", estado: "Sergipe", uf: "SE" },
  // Tocantins
  { cidade: "Palmas", estado: "Tocantins", uf: "TO" },
  { cidade: "Araguaína", estado: "Tocantins", uf: "TO" },
];

// Build MG cities as CidadeEstado objects
const cidadesMG: CidadeEstado[] = municipiosMG.map((cidade) => ({
  cidade,
  estado: "Minas Gerais",
  uf: "MG",
}));

export const cidadesBrasil: CidadeEstado[] = [
  ...otherCities,
  ...cidadesMG,
].sort((a, b) => `${a.cidade} - ${a.uf}`.localeCompare(`${b.cidade} - ${b.uf}`));

export function getCidadeLabel(c: CidadeEstado): string {
  return `${c.cidade} - ${c.uf}`;
}
