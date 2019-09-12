import axios, { AxiosResponse } from 'axios';
import { Environment } from '../components/types';
import { mapServiceDtoToService } from '../utils/helpers/MappingHelpers';
import { EnvironmentStateDto, ServiceDto } from './api.types';

const axiosWithBaseUrl = axios.create({ baseURL: '/api' });

export function getEnvironmentServicesRequest(env: Environment) {
    return axiosWithBaseUrl
        .get<EnvironmentStateDto>('/interrelationship/' + env)
        .then((response: AxiosResponse<EnvironmentStateDto>) =>
            response.data.serviceContracts.map((service: ServiceDto) => mapServiceDtoToService(service))
        );
}
