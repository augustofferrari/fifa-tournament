import type {
  CreatePlayerInput,
  ListPlayersOptions,
  Player,
  UpdatePlayerInput,
} from './player'

export type CreatePlayerRequest = CreatePlayerInput
export type CreatePlayerResponse = Player

export interface UpdatePlayerRequest {
  id: string
  input: UpdatePlayerInput
}
export type UpdatePlayerResponse = Player

export interface DeletePlayerRequest {
  id: string
}
export interface DeletePlayerResponse {
  deleted: true
}

export interface GetPlayerByIdRequest {
  id: string
}
export type GetPlayerByIdResponse = Player | null

export type ListPlayersRequest = ListPlayersOptions
export type ListPlayersResponse = Player[]

export type SelectPlayerPhotoResponse = string | null

export interface GetPlayerPhotoUrlRequest {
  photoPath: string | null
}

export interface GetPlayerPhotoUrlResponse {
  url: string | null
}
