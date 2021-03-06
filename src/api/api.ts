import axios, { AxiosResponse } from 'axios';
import { mapServiceDtoToService } from '../utils/helpers/MappingHelpers';
import { EnvironmentStateDto, ServiceDto } from './api.types';

export const apiBasePath = '/api';

const axiosWithBaseUrl = axios.create({ baseURL: apiBasePath });

export function getServicesRequest(env: string) {
    return axiosWithBaseUrl
        .get<EnvironmentStateDto>('/interrelationship/' + env)
        .then((response: AxiosResponse<EnvironmentStateDto>) =>
            response.data.serviceContracts.map((service: ServiceDto) => mapServiceDtoToService(service))
        );
}

export function getEnvironmentsRequest() {
    return axiosWithBaseUrl.get<string[]>('/environments').then((response: AxiosResponse<string[]>) => response.data);
}
