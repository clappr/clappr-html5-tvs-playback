import mockConsole from 'jest-mock-console'

import DRMHandler, { DRMFunctions } from './drm_handler'

const {
  getFullChallengeMessageTemplate,
  getLicenseOverrideMessageTemplate,
  getClearMessageTemplate,
  createDrmAgent,
} = DRMFunctions

const {
  sendLicenseRequest,
  clearLicenseRequest,
} = DRMHandler

let oipfdrmagent
const LOG_WARN_STYLE = 'color: #ff8000;font-weight: bold; font-size: 13px;'
const LOG_WARN_HEAD_MESSAGE = '%c[warn][DRMHandler]'

describe('DRMHandler', function() {
  beforeEach(() => {
    this.restoreConsole = mockConsole()
    jest.clearAllMocks()

    oipfdrmagent = createDrmAgent()
    oipfdrmagent.sendDRMMessage = () => {}
    jest.spyOn(DRMFunctions, 'createDrmAgent').mockReturnValue(oipfdrmagent)
  })
  afterEach(() => this.restoreConsole())

  test('only exports methods to handle with license request', () => {
    expect(DRMHandler.sendLicenseRequest).toBeDefined()
    expect(DRMHandler.clearLicenseRequest).toBeDefined()
    expect(DRMHandler.getFullChallengeMessageTemplate).toBeUndefined()
    expect(DRMHandler.getLicenseOverrideMessageTemplate).toBeUndefined()
    expect(DRMHandler.getClearMessageTemplate).toBeUndefined()
    expect(DRMHandler.createDrmAgent).toBeUndefined()
  })

  describe('getFullChallengeMessageTemplate method', () => {
    test('returns XML template with the composition of the received XML', () => {
      const header = 'fake_xml'
      const result = '<?xml version="1.0" encoding="utf-8"?>'
      + '<PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">'
      + '<LicenseAcquisition>'
      + `<Header>${header}</Header>`
      + '</LicenseAcquisition>'
      + '</PlayReadyInitiator>'
      const response = getFullChallengeMessageTemplate(header)

      expect(response).toEqual(result)
    })
  })

  describe('getLicenseOverrideMessageTemplate method', () => {
    test('returns XML template with received license server URL', () => {
      const fakeLicenseServerURL = 'http://fake-domain/fake_folder/playready?deviceId=FAKEID'
      const result = '<?xml version="1.0" encoding="utf-8"?>'
      + '<PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">'
      + '<LicenseServerUriOverride>'
      + `<LA_URL>${fakeLicenseServerURL}</LA_URL>`
      + '</LicenseServerUriOverride>'
      + '</PlayReadyInitiator>'
      const response = getLicenseOverrideMessageTemplate(fakeLicenseServerURL)

      expect(response).toEqual(result)
    })
  })

  describe('getClearMessageTemplate method', () => {
    test('returns XML template without any licenseServerURL', () => {
      const result = '<?xml version="1.0" encoding="utf-8"?>'
      + '<PlayReadyInitiator xmlns="http://schemas.microsoft.com/DRM/2007/03/protocols/">'
      + '</PlayReadyInitiator>'

      expect(getClearMessageTemplate()).toEqual(result)
    })
  })

  describe('createDrmAgent method', () => {
    test('returns a DOM element with a specific type to handle with the DRM license request', () => {
      const drmElement = DRMFunctions.createDrmAgent()

      expect(drmElement.tagName).toEqual('OBJECT')
      expect(drmElement.type).toEqual('application/oipfdrmagent')
    })

    test('returns a DOM element with properties that avoids showing it on the screen', () => {
      const drmElement = DRMFunctions.createDrmAgent()

      expect(drmElement.id).toEqual('oipfdrmagent')
      expect(drmElement.style.visibility).toEqual('hidden')
      expect(drmElement.style.position).toEqual('absolute')
      expect(drmElement.style.top).toEqual('0px')
      expect(drmElement.style.left).toEqual('0px')
      expect(drmElement.style.width).toEqual('0px')
      expect(drmElement.style.height).toEqual('0px')
    })
  })

  describe('sendLicenseRequest method', () => {
    beforeEach(() => {
      this.config = { licenseServerURL: 'http://fake-domain/fake_folder/playready?deviceId=FAKEID' }
    })
    afterEach(() => {
      const drmAgentElement = document.getElementById('oipfdrmagent')
      drmAgentElement && drmAgentElement.remove()
    })

    test('reuses drmAgent element if already exists', () => {
      document.body.appendChild(DRMFunctions.createDrmAgent())
      sendLicenseRequest(this.config)

      const duplicateIds = document.querySelectorAll('[id=\'oipfdrmagent\']')

      expect(duplicateIds.length).toEqual(1)
    })

    test('prefer to append drmAgent on parent element of received scope if exits', () => {
      const wantedScope = { el: document.createElement('div') }
      sendLicenseRequest.call(wantedScope, this.config)

      expect(wantedScope.el.firstChild.id).toEqual('oipfdrmagent')
    })

    test('appends drmAgent on document.body if any external scope is received', () => {
      sendLicenseRequest({ xmlLicenceAcquisition: 'fake_xml' })

      expect(document.body.firstChild.id).toEqual('oipfdrmagent')
    })

    test('calls the successCallback if the sendDRMMessage is not available', () => {
      const successCb = jest.fn()
      const errorCb = jest.fn()
      oipfdrmagent.sendDRMMessage = undefined
      sendLicenseRequest(this.config, successCb, errorCb)

      /* eslint-disable-next-line no-console */
      expect(console.log).toHaveBeenCalledWith(
        '%c[warn][DRMHandler]',
        'color: #ff8000;font-weight: bold; font-size: 13px;',
        'Error at sendDRMMessage call',
        'oipfdrmagent.sendDRMMessage is not a function',
      )

      expect(successCb).toHaveBeenCalledTimes(1)
    })

    describe('at onDRMRightsError callback', () => {
      test('don\'t calls the errorCallback if the received code number is greater o equal 2', () => {
        document.body.appendChild(DRMFunctions.createDrmAgent())
        const drmAgentElement = document.getElementById('oipfdrmagent')

        const successCb = jest.fn()
        const errorCb = jest.fn()
        sendLicenseRequest(this.config, successCb, errorCb)
        drmAgentElement.onDRMRightsError(2)

        expect(errorCb).not.toHaveBeenCalled()
      })

      test('returns one error if the received code number is below 2', () => {
        document.body.appendChild(DRMFunctions.createDrmAgent())
        const drmAgentElement = document.getElementById('oipfdrmagent')

        const successCb = jest.fn()
        const errorCb = jest.fn()
        sendLicenseRequest(this.config, successCb, errorCb)
        drmAgentElement.onDRMRightsError(1)

        expect(errorCb).toHaveBeenCalledWith('DRM: Invalid license error')
      })
    })

    describe('at onDRMMessageResult callback', () => {
      test('calls the errorCallback if the received result code is nonzero', () => {
        document.body.appendChild(DRMFunctions.createDrmAgent())
        const drmAgentElement = document.getElementById('oipfdrmagent')

        const successCb = jest.fn()
        const errorCb = jest.fn()
        sendLicenseRequest(this.config, successCb, errorCb)
        drmAgentElement.onDRMMessageResult(0, 'a error message', 1)
        drmAgentElement.onDRMMessageResult(0, 'success', 0)

        expect(errorCb).toHaveBeenCalledTimes(1)
      })

      test('calls the successCallback if the received result code is 0', () => {
        document.body.appendChild(DRMFunctions.createDrmAgent())
        const drmAgentElement = document.getElementById('oipfdrmagent')

        const cb = jest.fn()
        sendLicenseRequest(this.config, cb)
        drmAgentElement.onDRMMessageResult(0, 'a success message', 0)

        expect(cb).toHaveBeenCalled()
      })
    })
  })

  describe('clearLicenseRequest method', () => {
    afterEach(() => {
      const drmAgentElement = document.getElementById('oipfdrmagent')
      drmAgentElement && drmAgentElement.remove()
    })

    test('only clear license server if one drmAgent element already exists', () => {
      clearLicenseRequest()

      /* eslint-disable-next-line no-console */
      expect(console.log).toHaveBeenCalledWith(
        LOG_WARN_HEAD_MESSAGE,
        LOG_WARN_STYLE,
        'No one DRM license has been configured before. It\'s not necessary to clear any license server.',
      )
    })

    test('calls successCallback if no drmAgent element exists', () => {
      const successCb = jest.fn()
      const errorCb = jest.fn()
      clearLicenseRequest(successCb, errorCb)

      expect(successCb).toHaveBeenCalledTimes(1)
    })

    test('calls the errorCallback if the sendDRMMessage call fails', () => {
      const successCb = jest.fn()
      const errorCb = jest.fn()
      oipfdrmagent.sendDRMMessage = undefined
      document.body.appendChild(DRMFunctions.createDrmAgent())
      clearLicenseRequest(successCb, errorCb)

      /* eslint-disable-next-line no-console */
      expect(console.log).toHaveBeenCalledWith(
        '%c[error][DRMHandler]',
        'color: #ff0000;font-weight: bold; font-size: 13px;',
        'Error at sendDRMMessage call',
        'oipfdrmagent.sendDRMMessage is not a function',
      )

      expect(errorCb).toHaveBeenCalledTimes(1)
    })

    describe('at onDRMMessageResult callback', () => {
      test('removes drmAgentElement from DOM', () => {
        document.body.appendChild(DRMFunctions.createDrmAgent())
        const drmAgentElement = document.getElementById('oipfdrmagent')
        drmAgentElement.sendDRMMessage = () => {}

        const cb = jest.fn()
        clearLicenseRequest(cb)
        drmAgentElement.onDRMMessageResult()

        expect(document.getElementById('oipfdrmagent')).toBeNull()
      })

      test('calls the successCallback', () => {
        document.body.appendChild(DRMFunctions.createDrmAgent())
        const drmAgentElement = document.getElementById('oipfdrmagent')
        drmAgentElement.sendDRMMessage = () => {}

        const cb = jest.fn()
        clearLicenseRequest(cb)
        drmAgentElement.onDRMMessageResult()

        expect(cb).toHaveBeenCalled()
      })
    })
  })
})
