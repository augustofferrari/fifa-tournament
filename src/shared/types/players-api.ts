import type {
  CreatePlayerInput,
  ListPlayersOptions,
  Player,
  UpdatePlayerInput,
} from '@shared/types/player'
import type {
  CreatePlayerResponse,
  DeletePlayerResponse,
  GetPlayerByIdResponse,
  GetPlayerPhotoUrlResponse,
  ListPlayersResponse,
  SelectPlayerPhotoResponse,
  UpdatePlayerResponse,
} from '@shared/types/player-ipc'

export interface PlayersNamespace {
  create(input: CreatePlayerInput): Promise<CreatePlayerResponse>
  update(id: string, input: UpdatePlayerInput): Promise<UpdatePlayerResponse>
  delete(id: string): Promise<DeletePlayerResponse>
  getById(id: string): Promise<GetPlayerByIdResponse>
  list(options?: ListPlayersOptions): Promise<ListPlayersResponse>
  selectPhoto(): Promise<SelectPlayerPhotoResponse>
  getPhotoUrl(photoPath: string | null): Promise<GetPlayerPhotoUrlResponse>
}

export type { Player }
