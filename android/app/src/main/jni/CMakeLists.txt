cmake_minimum_required(VERSION 3.16)
project(LocalBuddyApp)

# Find packages
find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)

add_library(native-lib SHARED
    main.cpp
)

target_link_libraries(native-lib
    fbjni::fbjni
    ReactAndroid::reactnative
)