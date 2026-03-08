function(ctx) {
  identityId: ctx.identity.id,
  traits: { 
    email: ctx.identity.traits.email, 
    username: ctx.identity.traits.username, 
    avatar_url: ctx.identity.traits.avatar_url,
  },
}