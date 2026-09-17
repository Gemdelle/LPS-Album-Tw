-- LPS Twitch → Stream Avatars gift queue
-- Run as: On Connect
-- Completá estas 3 variables antes de conectar:

APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrKcUJQodyhUsT5KFIKBk2GqyQZtRM6cUZy4h1DTriPaGziU3DulhwsKLmfDPLIO3O3A/exec'  -- termina en /exec
SHARED_SECRET = 'PEGAR_EL_MISMO_SECRETO_QUE_EN_APPS_SCRIPT'
POLL_INTERVAL = 12  -- segundos entre consultas

script_trigger_type = 'On Connect'

function isSafeTwitch(name)
    return type(name) == 'string' and string.match(name, '^[%w_][%w_][%w_]+$') ~= nil and #name <= 25
end

function isSafeAvatarId(id)
    return type(id) == 'string' and string.match(id, '^[%w][%w_%-]*$') ~= nil and #id <= 64
end

function urlEncode(value)
    return tostring(value or ''):gsub('([^%w%-_%.~])', function(c)
        return string.format('%%%02X', string.byte(c))
    end)
end

function callScript(payload)
    local parts = {}
    for key, value in pairs(payload) do
        table.insert(parts, urlEncode(key) .. '=' .. urlEncode(value))
    end
    local url = APPS_SCRIPT_URL .. '?' .. table.concat(parts, '&')
    local ok, responseText = pcall(function()
        return getWebRequest(url, nil, nil)
    end)
    if not ok then
        return false, nil, tostring(responseText)
    end
    local parsedOk, parsed = pcall(function()
        return json.parse(responseText)
    end)
    if not parsedOk or type(parsed) ~= 'table' then
        return false, nil, 'invalid_json:' .. tostring(responseText)
    end
    return true, parsed, nil
end

function processOneAdoption()
    if SHARED_SECRET == 'PEGAR_EL_MISMO_SECRETO_QUE_EN_APPS_SCRIPT' or SHARED_SECRET == '' then
        log('[LPS] Completá APPS_SCRIPT_URL y SHARED_SECRET en el script Lua.')
        return
    end

    local ok, data, err = callScript({ action = 'claimNext', secret = SHARED_SECRET })
    if not ok then
        log('[LPS] claimNext falló: ' .. tostring(err))
        return
    end
    if data.service == 'lps-twitch-adopt' then
        log('[LPS] el script contestó health, no claimNext. Republicá el Apps Script (New version).')
        return
    end
    if data.ok == false then
        log('[LPS] claimNext error: ' .. tostring(data.error))
        return
    end
    if data.disabled then
        log('[LPS] AUTOMATION_ENABLED=false')
        return
    end
    if data.empty or not data.adoptionId then
        log('[LPS] cola vacía: ' .. tostring(data.hint or 'pending + saId válido'))
        return
    end

    local adoptionId = tostring(data.adoptionId)
    local user = tostring(data.twitchUsername or '')
    local avatarId = tostring(data.streamAvatarsId or '')

    if not isSafeTwitch(user) or not isSafeAvatarId(avatarId) then
        log('[LPS] datos inválidos, no se ejecuta gift. adoptionId=' .. adoptionId)
        callScript({
            action = 'error',
            secret = SHARED_SECRET,
            adoptionId = adoptionId,
            message = 'invalid_username_or_avatar_id'
        })
        return
    end

    local command = '!gift ' .. user .. ' avatar ' .. avatarId
    log('[LPS] ' .. command)
    runCommand(command, true)

    local confirmOk, confirmData, confirmErr = callScript({
        action = 'confirm',
        secret = SHARED_SECRET,
        adoptionId = adoptionId
    })
    if not confirmOk or not confirmData or confirmData.ok == false then
        log('[LPS] confirm falló: ' .. tostring(confirmErr or (confirmData and confirmData.error)))
        callScript({
            action = 'error',
            secret = SHARED_SECRET,
            adoptionId = adoptionId,
            message = 'confirm_failed'
        })
        return
    end
    log('[LPS] entregado ' .. adoptionId .. ' -> ' .. user)
end

function pollLoop()
    log('[LPS] cola de adopciones activa')
    while true do
        local ok, err = pcall(processOneAdoption)
        if not ok then
            log('[LPS] poll error: ' .. tostring(err))
        end
        wait(POLL_INTERVAL)
    end
end

return function()
    async('pollLoop')
    keepAlive()
end
