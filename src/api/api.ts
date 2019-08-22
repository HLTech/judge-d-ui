import axios, { AxiosResponse } from 'axios';
import { Environment } from '../components/types';
import { mapServiceDtoToService } from '../helpers/MappingHelpers';
import { EnvironmentStateDto, ServiceDto } from './api.types';

const baseURL = 'https://judge-d.herokuapp.com';
const axiosWithBaseUrl = axios.create({ baseURL });

export function getEnvironmentServicesRequest(env: Environment) {
    return axiosWithBaseUrl
        .get<EnvironmentStateDto>('/interrelationship/' + env)
        .then((response: AxiosResponse<EnvironmentStateDto>) =>
            response.data.serviceContracts.map((service: ServiceDto) => mapServiceDtoToService(service))
        );
}
