import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    console.log(req.body)
    const { title, description } = req.body

    if ([title, description].some((field) => !field?.trim())) {
        throw new ApiError(400, "Title and Description are required")
    }

    const playlistBy = req?.user?._id
    const playlist = await Playlist.create({
        title,
        description,
        playlistBy
    })

    if (!playlist) {
        throw new ApiError(410, "Error while creating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!userId) {
        throw new ApiError(400, "User Id not found")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                playlistBy: new mongoose.Types.ObjectId(userId)
            }
        },
    ])

    if (!playlists) {
        throw new ApiError(404, "Error while fetching playlists")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id not found")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnailFile: 1,
                            duration: 1,
                            owner: 1,
                            createdAt: 1,
                            updatedAt: 1
                        }
                    }
                ]
            }
        }
    ])

    if (!playlist) {
        throw new ApiError(404, "Error while fetching playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if ([playlistId, videoId].some((field) => !field?.trim())) {
        throw new ApiError(400, "Playlist Id or Video Id not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    playlist.videos.push(videoId)
    const updatedPlaylist = await playlist.save({validatebeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if ([playlistId, videoId].some((field) => !field?.trim())) {
        throw new ApiError(400, "Playlist Id or Video Id not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    playlist.videos = playlist.videos.filter((v) => !v.equals(videoId))
    const updatedPlaylist = await playlist.save({validatebeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }

    try {
        await Playlist.deleteOne({ _id: playlistId })
    } catch (error) {
        throw new ApiError(410, "Error while deleting playlist", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Playlist deleted successfully"
            ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { title, description } = req.body

    if ([title, description].some((field) => !field?.trim())) {
        throw new ApiError(400, "Title and Description are required")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    playlist.title = title
    playlist.description = description
    const updatedPlaylist = await playlist.save({ validatebeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"
            ))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}