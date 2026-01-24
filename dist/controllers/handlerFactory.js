import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/APIFeatures.js';
// Generic delete
export const deleteOne = (model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(204).send();
    });
};
// Generic create
export const createOne = (model) => {
    return catchAsync(async (req, res) => {
        const doc = await model.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { doc }
        });
    });
};
// Generic update
export const updateOne = (model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { doc }
        });
    });
};
// Generic get all
export const getAll = (model) => {
    return catchAsync(async (req, res) => {
        let filter = {};
        if (req.tourId)
            filter = { _id: req.tourId };
        const queryParams = req.customQuery || req.query;
        const features = new APIFeatures(model, model.find(filter), queryParams)
            .filtering()
            .sorting()
            .fieldsLimiting()
            .paginating();
        const docs = await features.query;
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: { docs }
        });
    });
};
// Generic get one
export const getOne = (model, populate) => {
    return catchAsync(async (req, res, next) => {
        let query = model.findById(req.params.id);
        if (populate)
            query = query.populate(populate);
        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { doc }
        });
    });
};
