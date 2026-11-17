import { Request, Response } from "express";
import { Service } from "../models/Service";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadToImgBB } from "../services/imgbb.service";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    category,
    sortPrice,
    page = "1",
    limit = "12",
  } = req.query;

  const query: Record<string, unknown> = { isActive: true };

  if (category && category !== "All") {
    query.category = category;
  }

  if (search && typeof search === "string" && search.trim() !== "") {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const sortOptions: Record<string, 1 | -1> = {};
  if (sortPrice === "asc") {
    sortOptions.price = 1;
  } else if (sortPrice === "desc") {
    sortOptions.price = -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 12);
  const skip = (pageNum - 1) * limitNum;

  const [services, totalCount] = await Promise.all([
    Service.find(query).sort(sortOptions).skip(skip).limit(limitNum),
    Service.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        services,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
      "Services retrieved successfully."
    )
  );
});

export const getFeaturedServices = asyncHandler(
  async (_req: Request, res: Response) => {
    const services = await Service.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json(
      new ApiResponse(200, services, "Featured services retrieved successfully.")
    );
  }
);

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Service.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          minPrice: { $min: "$price" },
        },
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          minPrice: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json(
      new ApiResponse(200, categories, "Categories retrieved successfully.")
    );
  }
);

export const getServiceById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    res.status(200).json(
      new ApiResponse(200, service, "Service details retrieved successfully.")
    );
  }
);

export const createService = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      title,
      category,
      description,
      price,
      durationMinutes,
      images,
      specialists,
      isActive,
    } = req.body;

    let baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Service.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const service = await Service.create({
      title,
      slug: uniqueSlug,
      category,
      description,
      price,
      durationMinutes,
      images: images || [],
      specialists: specialists || ["Senior Specialist"],
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(
      new ApiResponse(201, service, "Service created successfully.")
    );
  }
);

export const updateService = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await Service.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    res.status(200).json(
      new ApiResponse(200, service, "Service updated successfully.")
    );
  }
);

export const deleteService = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    res.status(200).json(
      new ApiResponse(200, null, "Service deleted successfully.")
    );
  }
);

export const toggleServiceStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      throw new ApiError(404, "Service not found.");
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json(
      new ApiResponse(
        200,
        service,
        `Service has been ${service.isActive ? "activated" : "deactivated"}.`
      )
    );
  }
);

export const uploadServiceImage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, "Please upload an image file.");
    }

    const imageUrl = await uploadToImgBB(
      req.file.buffer,
      req.file.originalname || "service.jpg"
    );

    res.status(200).json(
      new ApiResponse(
        200,
        { url: imageUrl },
        "Service image uploaded to ImgBB successfully."
      )
    );
  }
);
