// const asyncHandler = (requestHandler) => {
//     return async (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//             .catch((error) => {
//                 next(error);
//                 });
//     }
// }
// export { asyncHandler };

import { ApiError } from "./apiError.utils.js";

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    errors: error.errors || []
                });
            }
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                errors: [error.message]
            });
        }
    };
};

export { asyncHandler };
