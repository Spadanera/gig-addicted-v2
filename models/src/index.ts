import { RowDataPacket } from "mysql2"

export enum Roles {
  owner = 'owner',
  editor_detail = 'editor_details',
  editor_setlist = 'editor_setlist',
  editor_event = 'editor_event',
  editor_member = 'editor_member',
  viewer  = 'viwer',
  unauthorized = 'unauthorized'
}

export interface Reset {
  id?: number
  email: string
  token: string
  creation_date: Date
}

export interface Invitation extends User {
  
}

export interface Repository extends RowDataPacket {

}

export interface User extends Repository {
  id?: number
  username?: string
  email: string
  password?: string
  creation_date?: string
  last_login_date?: Date
  status?: string
  googleId?: string
  token?: string
  avatar?: string
  bands?: [BandMember]
}

export interface Band extends Repository {
  id?: number
  name?: string
  description?: string
  biography?: string
  logo?: string
  isPublic?: boolean
  repertoire?: [Song],
  setlist?: [Setlist],
  members?: [BandMember]
  songs?: [Song]
}

export interface BandMember extends Repository {
  id: number
  user_id: number
  band_id: number
  role: Roles
}

export interface Song extends Repository {
  id: number
  name: string
  band_id: string
  artist: string
  duration: number
  link: string
  removed: boolean
}

export interface Setlist extends Repository {
  id: number
  name: string
  band_id: number
  template?: boolean
  duration?: number
  isPublic?: boolean
  songs?: SetlistSong[]
}

export interface SetlistSong extends Song {
  id: number
  setlist_id: number
  song_id: number
  position: number
}

export interface SetlistInput extends Repository { 
  editSong: SetlistSong[], 
  addedSong: SetlistSong[], 
  removedSong: SetlistSong[] 
}

export interface Event extends Repository {
  id: number
  name: string
  band_id: number
  band: Band
  setlist_id: number
  setlist: Setlist
  venue_id: number
  venue: Venue
  vanue_name: string
  members: BandMember
  address: string
  datetime: Date
  poster: string
}

export interface Venue extends Repository {
  id: number
  name: string
  address: string
  website?: string
}

export interface MemberEvent extends Repository {
  id: number
  member_id: number
  event_id: number
}