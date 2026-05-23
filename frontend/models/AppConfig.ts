import mongoose from "mongoose"

const AppConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
  },
})

AppConfigSchema.index({ key: 1 })

AppConfigSchema.pre("save", function () {
  this.updatedAt = new Date()
})

export default mongoose.models.AppConfig || mongoose.model("AppConfig", AppConfigSchema)
