import provinceData from '../assets/provice.json';

interface IProvince {
    id: number;
    name_th: string;
    name_en: string;
    geography_id: number;
    created_at: string;
    updated_at: string;
    deleted_at: boolean | null;
}

const provinces: IProvince[] = provinceData;

export default provinces;
