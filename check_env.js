const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
    console.log("STATUS: MISSING_KEY");
} else {
    console.log("STATUS: KEY_PRESENT, Length: " + key.length);
}
