export interface EnvironmentStateDto {
    environment: string;
    serviceContracts: ServiceDto[];
}

export interface ServiceDto {
    name: string;
    version: string;
    capabilities: ServiceCommunicationDto;
    expectations: ExpectationsDto;
}

export interface ServiceCommunicationDto {
    [key: string]: {
        value: string;
        mimeType: string;
    };
}

export interface ExpectationsDto {
    [key: string]: ServiceCommunicationDto;
}
