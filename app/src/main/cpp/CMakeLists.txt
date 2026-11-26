# Chat DNR Ai 그림 엔진: stable-diffusion.cpp(MIT, ggml)를 폰 CPU로
cmake_minimum_required(VERSION 3.22)
project(dnrimg C CXX)

set(SD_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(SD_WEBP OFF CACHE BOOL "" FORCE)
set(SD_WEBM OFF CACHE BOOL "" FORCE)
set(SD_BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(GGML_NATIVE OFF CACHE BOOL "" FORCE)
set(GGML_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(GGML_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
if (ANDROID_ABI STREQUAL "arm64-v8a")
    # 스냅드래곤 8 Elite 계열: 반정밀도 · 내적 명령으로 빠르게
    set(GGML_CPU_ARM_ARCH "armv8.2-a+dotprod+fp16" CACHE STRING "" FORCE)
endif()
set(CMAKE_BUILD_TYPE Release)

add_subdirectory(sdcpp)

add_library(dnrimg SHARED dnrimg.cpp)
target_include_directories(dnrimg PRIVATE sdcpp/include sdcpp)
target_link_libraries(dnrimg stable-diffusion log android)
target_compile_options(dnrimg PRIVATE -O3)
