// Brazilian cities organized by state (capitals + major cities)
interface CidadeEstado {
  cidade: string;
  estado: string;
  uf: string;
}

export const cidadesBrasil: CidadeEstado[] = [
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
  // Minas Gerais
  { cidade: "Belo Horizonte", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Uberlândia", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Contagem", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Juiz de Fora", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Betim", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Montes Claros", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Ribeirão das Neves", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Uberaba", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Governador Valadares", estado: "Minas Gerais", uf: "MG" },
  { cidade: "Ipatinga", estado: "Minas Gerais", uf: "MG" },
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
].sort((a, b) => `${a.cidade} - ${a.uf}`.localeCompare(`${b.cidade} - ${b.uf}`));

export function getCidadeLabel(c: CidadeEstado): string {
  return `${c.cidade} - ${c.uf}`;
}
