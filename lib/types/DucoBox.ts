import DucoBoxApiTypeEnum from "./DucoBoxApiTypeEnum";

export = DucoBox;

interface DucoBox {
    id: number
    name: string
    apiType: DucoBoxApiTypeEnum
    hostname: string
    useHttps: boolean
}