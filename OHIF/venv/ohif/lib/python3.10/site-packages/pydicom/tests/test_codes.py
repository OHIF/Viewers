
import pytest

from pydicom.sr._cid_dict import cid_concepts as CID_CONCEPTS
from pydicom.sr.coding import Code
from pydicom.sr.codedict import codes, _CID_Dict, _CodesDict
from pydicom.uid import UID


@pytest.fixture()
def ambiguous_scheme():
    """Add a scheme to the CID concepts dict that contains a duplicate attr"""
    cid = 6129
    attr = CID_CONCEPTS[cid]['SCT'][0]
    assert 'FOO' not in CID_CONCEPTS[cid]
    CID_CONCEPTS[cid]['FOO'] = [attr]
    yield attr, cid
    del CID_CONCEPTS[cid]['FOO']


class TestCode:
    def setup(self):
        self._value = "373098007"
        self._meaning = "Mean Value of population"
        self._scheme_designator = "SCT"

    def test_construction_kwargs(self):
        c = Code(
            value=self._value,
            scheme_designator=self._scheme_designator,
            meaning=self._meaning,
        )
        assert c.value == self._value
        assert c.scheme_designator == self._scheme_designator
        assert c.meaning == self._meaning
        assert c.scheme_version is None

    def test_use_as_dictionary_key(self):
        c = Code(
            value=self._value,
            scheme_designator=self._scheme_designator,
            meaning=self._meaning,
        )
        d = {c: 1}
        assert c in d.keys()

    def test_construction_kwargs_optional(self):
        version = "v1.0"
        c = Code(
            value=self._value,
            scheme_designator=self._scheme_designator,
            meaning=self._meaning,
            scheme_version=version,
        )
        assert c.value == self._value
        assert c.scheme_designator == self._scheme_designator
        assert c.meaning == self._meaning
        assert c.scheme_version == version

    def test_construction_args(self):
        c = Code(self._value, self._scheme_designator, self._meaning)
        assert c.value == self._value
        assert c.scheme_designator == self._scheme_designator
        assert c.meaning == self._meaning
        assert c.scheme_version is None

    def test_construction_args_optional(self):
        version = "v1.0"
        c = Code(self._value, self._scheme_designator, self._meaning, version)
        assert c.value == self._value
        assert c.scheme_designator == self._scheme_designator
        assert c.meaning == self._meaning
        assert c.scheme_version == version

    def test_equal(self):
        c1 = Code(self._value, self._scheme_designator, self._meaning)
        c2 = Code(self._value, self._scheme_designator, self._meaning)
        assert c1 == c2

    def test_not_equal(self):
        c1 = Code(self._value, self._scheme_designator, self._meaning)
        c2 = Code("373099004", "SCT", "Median Value of population")
        assert c1 != c2

    def test_equal_ignore_meaning(self):
        c1 = Code(self._value, self._scheme_designator, self._meaning)
        c2 = Code(self._value, self._scheme_designator, "bla bla bla")
        assert c1 == c2

    def test_equal_equivalent_coding(self):
        c1 = Code(self._value, self._scheme_designator, self._meaning)
        c2 = Code("R-00317", "SRT", self._meaning)
        assert c1 == c2
        assert c2 == c1


class TestCodesDict:
    def test_dcm_1(self):
        assert codes.DCM.Modality == Code(
            value="121139", scheme_designator="DCM", meaning="Modality"
        )

    def test_dcm_2(self):
        assert codes.DCM.ProcedureReported == Code(
            value="121058",
            scheme_designator="DCM",
            meaning="Procedure Reported",
        )

    def test_dcm_3(self):
        assert codes.DCM.ImagingStartDatetime == Code(
            value="122712",
            scheme_designator="DCM",
            meaning="Imaging Start DateTime",
        )

    def test_sct_1(self):
        assert codes.SCT._1SigmaLowerValueOfPopulation == Code(
            value="371919006",
            scheme_designator="SCT",
            meaning="1 Sigma Lower Value of Populuation",
        )

    def test_sct_2(self):
        assert codes.SCT.FindingSite == Code(
            value="363698007", scheme_designator="SCT", meaning="Finding Site"
        )

    def test_cid250(self):
        assert codes.cid250.Positive == Code(
            value="10828004", scheme_designator="SCT", meaning="Positive"
        )

    def test_cid300(self):
        assert codes.cid300.NickelCobaltChromium == Code(
            value="261249004",
            scheme_designator="SCT",
            meaning="Nickel cobalt chromium",
        )

    def test_cid301(self):
        assert codes.cid301.mgcm3 == Code(
            value="mg/cm3", scheme_designator="UCUM", meaning="mg/cm^3"
        )

    def test_cid402(self):
        assert codes.cid402.DestinationRoleID == Code(
            value="110152",
            scheme_designator="DCM",
            meaning="Destination Role ID",
        )

    def test_cid405(self):
        assert codes.cid405.MultiMediaCard == Code(
            value="110035", scheme_designator="DCM", meaning="Multi-media Card"
        )

    def test_cid610(self):
        assert codes.cid610.ReverseOsmosisPurifiedHclAcidifiedWater == Code(
            value="127291",
            scheme_designator="DCM",
            meaning="Reverse osmosis purified, HCl acidified water",
        )

    def test_cid612(self):
        assert codes.cid612.MonitoredAnesthesiaCareMAC == Code(
            value="398239001",
            scheme_designator="SCT",
            meaning="Monitored Anesthesia Care (MAC)",
        )

    def test_cid622(self):
        assert codes.cid622.NeuromuscularBlockingNMBNonDepolarizing == Code(
            value="372790002",
            scheme_designator="SCT",
            meaning="NeuroMuscular Blocking (NMB) - non depolarizing",
        )

    def test_cid630(self):
        assert codes.cid630.LidocainePrilocaine == Code(
            value="346553009",
            scheme_designator="SCT",
            meaning="Lidocaine + Prilocaine",
        )

    def test_cid643(self):
        assert codes.cid643._6Hydroxydopamine == Code(
            value="4624",
            scheme_designator="PUBCHEM_CID",
            meaning="6-Hydroxydopamine",
        )

    def test_cid646(self):
        assert codes.cid646.SPECTCTOfWholeBody == Code(
            value="127902",
            scheme_designator="DCM",
            meaning="SPECT CT of Whole Body",
        )

    def test_cid1003(self):
        assert codes.cid1003.LevelOfT11T12IntervertebralDisc == Code(
            value="243918001",
            scheme_designator="SCT",
            meaning="Level of T11/T12 intervertebral disc",
        )

    def test_cid3000(self):
        assert codes.cid3000.OperatorNarrative == Code(
            value="109111",
            scheme_designator="DCM",
            meaning="Operator's Narrative",
        )

    def test_cid3001_1(self):
        assert codes.cid3001.Avr == Code(
            value="2:65", scheme_designator="MDC", meaning="-aVR"
        )

    def test_cid3001_2(self):
        assert codes.cid3001.NegativeLowRightScapulaLead == Code(
            value="2:124",
            scheme_designator="MDC",
            meaning="negative: low right scapula Lead",
        )

    def test_cid3107(self):
        assert codes.cid3107._13Nitrogen == Code(
            value="21576001", scheme_designator="SCT", meaning="^13^Nitrogen"
        )

    def test_cid3111(self):
        assert codes.cid3111.Tc99mTetrofosmin == Code(
            value="404707004",
            scheme_designator="SCT",
            meaning="Tc-99m tetrofosmin",
        )

    def test_cid3263(self):
        meaning = (
            "12-lead from EASI leads (ES, AS, AI)"
            " by Dower/EASI transformation"
        )
        assert (
            codes.cid3263._12LeadFromEASILeadsESASAIByDowerEASITransformation
            == Code(
                value="10:11284", scheme_designator="MDC", meaning=meaning,
            )
        )

    def test_cid3335(self):
        assert codes.cid3335.PWaveSecondDeflectionInPWave == Code(
            value="10:320",
            scheme_designator="MDC",
            meaning="P' wave (second deflection in P wave)",
        )

    def test_contained(self):
        c = Code("24028007", "SCT", "Right")
        assert c in codes.cid244

    def test_not_contained(self):
        c = Code("130290", "DCM", "Median")
        assert c not in codes.cid244

    def test_dunder_dir(self):
        d = _CodesDict('UCUM')
        assert "ArbitraryUnit" in dir(d)
        assert "Year" in dir(d)
        assert "__delattr__" in dir(d)
        assert "trait_names" in dir(d)
        assert isinstance(dir(d), list)

    def test_dir(self):
        d = _CodesDict('UCUM')
        assert isinstance(d.dir(), list)
        assert "ArbitraryUnit" in d.dir()
        assert "Year" in d.dir()
        assert d.dir("xyz") == []
        assert "Radian" in d.dir("ia")

    def test_schemes(self):
        d = _CodesDict('UCUM')
        assert 'UCUM' in list(d.schemes())
        schemes = list(codes.schemes())
        assert 'UCUM' in schemes
        assert 'DCM' in schemes
        assert 'SCT' in schemes

    def test_trait_names(self):
        d = _CodesDict('UCUM')
        assert "ArbitraryUnit" in d.trait_names()
        assert "Year" in d.trait_names()
        assert "__delattr__" in d.trait_names()
        assert "trait_names" in d.trait_names()

    def test_getattr_CID_with_scheme_raises(self):
        msg = "Cannot use a CID with a scheme dictionary"
        with pytest.raises(AttributeError, match=msg):
            _CodesDict('UCUM').cid2

    def test_getattr_unknown_attr_raises(self):
        msg = "Unknown code name 'bar' for scheme 'UCUM'"
        with pytest.raises(AttributeError, match=msg):
            _CodesDict('UCUM').bar

    def test_getattr_nonunique_attr_raises(self):
        attr = "LeftVentricularInternalDiastolicDimensionBSA"
        msg = f"Multiple code values for '{attr}' found: 80009-4, 80010-2"
        with pytest.raises(RuntimeError, match=msg):
            _CodesDict('LN').LeftVentricularInternalDiastolicDimensionBSA


class TestCIDDict:
    def test_concepts(self):
        d = _CID_Dict(2)
        assert "Afferent" in d.concepts
        code = d.concepts["Afferent"]
        assert isinstance(code, Code)
        assert code.value == "49530007"

    def test_dunder_dir(self):
        d = _CID_Dict(2)
        assert "Afferent" in dir(d)
        assert "Vertical" in dir(d)
        assert "__contains__" in dir(d)
        assert "trait_names" in dir(d)
        assert isinstance(dir(d), list)

    def test_dir(self):
        d = _CID_Dict(2)
        assert isinstance(d.dir(), list)
        assert "Afferent" in d.dir()
        assert "Vertical" in d.dir()

        assert d.dir("xyz") == []
        assert "Axial" in d.dir("ia")
        assert "Superficial" in d.dir("ia")
        assert "Axial" in d.dir("IA")
        assert "Superficial" in d.dir("IA")

    def test_trait_names(self):
        d = _CID_Dict(2)
        assert isinstance(d.trait_names(), list)
        assert "Afferent" in d.trait_names()
        assert "Vertical" in d.trait_names()

    def test_str(self):
        d = _CID_Dict(2)
        s = str(d)
        assert "CID 2 (AnatomicModifier)" in s
        assert "Afferent             49530007     SCT      Afferent" in s
        assert "Vertical             33096000     SCT      Vertical" in s

    def test_repr(self):
        d = _CID_Dict(2)
        r = repr(d)
        assert "CID 2" in r
        assert "Afferent = Code(value='49530007'" in r
        assert "Vertical = Code(value='33096000'" in r

    def test_getattr_match(self):
        d = _CID_Dict(2)
        code = d.Afferent
        assert isinstance(code, Code)
        assert code.value == "49530007"

    def test_getattr_no_match_raises(self):
        d = _CID_Dict(2)
        msg = r"'XYZ' not found in CID 2"
        with pytest.raises(AttributeError, match=msg):
            d.XYZ

    def test_getattr_match_multiple_codes_raises(self):
        # Same attribute for multiple codes
        d = _CID_Dict(12300)
        msg = (
            r"'LeftVentricularInternalDiastolicDimensionBSA' "
            r"has multiple code matches in CID 12300: '80009-4', '80010-2'"
        )
        with pytest.raises(AttributeError, match=msg):
            d.LeftVentricularInternalDiastolicDimensionBSA

    def test_getattr_ambiguous_attr_raises(self, ambiguous_scheme):
        attr, cid = ambiguous_scheme
        msg = f"Multiple schemes found for '{attr}' in CID 6129: SCT, FOO"
        with pytest.raises(AttributeError, match=msg):
            getattr(_CID_Dict(cid), attr)
