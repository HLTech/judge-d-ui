import axios, { AxiosResponse } from 'axios';
import { Environment } from '../components/types';
import { mapServiceDtoToService } from '../utils/helpers/MappingHelpers';
import { EnvironmentStateDto, ServiceDto } from './api.types';
import { config } from './config';

const baseURL = config.get('BASE_PATH');
const axiosWithBaseUrl = axios.create({ baseURL });

export function getEnvironmentServicesRequest(env: Environment) {
    return axiosWithBaseUrl
        .get<EnvironmentStateDto>('/interrelationship/' + env)
        .then((response: AxiosResponse<EnvironmentStateDto>) =>
            response.data.serviceContracts.map((service: ServiceDto) => mapServiceDtoToService(service))
        );
}
