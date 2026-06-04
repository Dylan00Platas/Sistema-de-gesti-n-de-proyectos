
export const DIVISIONES = {
  DA: 'BAJA CALIFORNIA',
  DB: 'NOROESTE',
  DC: 'NORTE',
  DD: 'GOLFO NORTE',
  DF: 'CENTRO OCCIDENTE',
  DG: 'CENTRO SUR',
  DJ: 'ORIENTE',
  DK: 'SURESTE',
  DL: 'VALLE DE MEXICO NORTE',
  DM: 'VALLE DE MEXICO CENTRO',
  DN: 'VALLE DE MEXICO SUR',
  DP: 'BAJIO',
  DU: 'GOLFO CENTRO',
  DV: 'CENTRO ORIENTE',
  DW: 'PENINSULAR',
  DX: 'JALISCO'
};

export const ZONAS = {
  DJ: {
    '01': 'POZA RICA',
    '02': 'XALAPA',
    '03': 'TEZIUTLAN',
    '06': 'VERACRUZ',
    '07': 'PAPALOAPAN',
    '10': 'LOS TUXTLAS',
    '11': 'COATZACOALCOS',
    '13': 'ORIZABA',
    '14': 'CORDOBA'
  }
};

export const ZONAS_LIST = [
  { idDivision: 'DJ', idZona: '01', nombre: 'POZA RICA' },
  { idDivision: 'DJ', idZona: '02', nombre: 'XALAPA' },
  { idDivision: 'DJ', idZona: '03', nombre: 'TEZIUTLAN' },
  { idDivision: 'DJ', idZona: '06', nombre: 'VERACRUZ' },
  { idDivision: 'DJ', idZona: '07', nombre: 'PAPALOAPAN' },
  { idDivision: 'DJ', idZona: '10', nombre: 'LOS TUXTLAS' },
  { idDivision: 'DJ', idZona: '11', nombre: 'COATZACOALCOS' },
  { idDivision: 'DJ', idZona: '13', nombre: 'ORIZABA' },
  { idDivision: 'DJ', idZona: '14', nombre: 'CORDOBA' }
];

export const getNombreDivision = (idDivision) => {
  return DIVISIONES[idDivision] || idDivision;
};

export const getNombreZona = (idDivision, idZona) => {
  if (ZONAS[idDivision] && ZONAS[idDivision][idZona]) {
    return ZONAS[idDivision][idZona];
  }
  return idZona;
};

export const getZonasByDivision = (idDivision) => {
  if (ZONAS[idDivision]) {
    return Object.entries(ZONAS[idDivision]).map(([idZona, nombre]) => ({
      idZona,
      nombre
    }));
  }
  return [];
};

export const getIdDivisionByNombre = (nombreDivision) => {
  return Object.keys(DIVISIONES).find(key => 
    DIVISIONES[key].toLowerCase() === nombreDivision.toLowerCase()
  );
};

export default {
  DIVISIONES,
  ZONAS,
  ZONAS_LIST,
  getNombreDivision,
  getNombreZona,
  getZonasByDivision,
  getIdDivisionByNombre
};