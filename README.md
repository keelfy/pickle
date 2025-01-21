# Pickle API

This is the API for the Pickle app. 

## What is Pickle?

Pickle is a platform for collecting and sharing a content that users find interesting or worth remembering.
Also, it is a platform for content-makers to communicate with their audience by giving sharing opinions.

## Brief overview of the pickle infrastructure

Note that this is a first version of the infrastructure, and it will be changed in the future.

![Pickle Infrastructure](./readme/architecture%20v1.png)

## Useful links

- [DEPLOYED DEMO](https://pickle.pw/keelfy)
- [frontend repo](https://github.com/keelfy/pickle-front)
- [figma design](https://www.figma.com/design/2X3MAm8ddAmANWGLQHiP5h/Pickle)
- [tasks board on linear](https://linear.app/rubedo/team/PIC)

## Short-term goals for the API only (2025-01-21)

1. Implement the same logic as for games for the movies, series, anime, and videos.
2. A complete cache layer for the API, using Redis (only imgproxy URLs cached at the moment). 
3. Payment processing for the content orders using Paddle.
4. An option to switch on/off the orders.
5. Support for moderators to help content makers to moderate their content.
6. Integration with the DonationAlerts, DonatePay, Streamlabs and StreamElements (maybe other services too, but these for starters).
7. OpenTelementry to track the API usage.

-- That's it for the next couple of months :)
