Attribute VB_Name = "KarabarGenerateB"
Option Explicit

' Sheet1
' F: source pattern (e.g. a-qV?d-al)
' L: class indicator (1..4)
' B: output
Public Sub GenerateBFromF()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim r As Long
    Dim src As String
    Dim cleaned As String
    Dim cls As Long

    Set ws = ThisWorkbook.Worksheets("Sheet1")
    lastRow = ws.Cells(ws.Rows.Count, "F").End(xlUp).Row

    For r = 2 To lastRow
        If Len(Trim$(CStr(ws.Cells(r, "B").Value))) > 0 Then GoTo ContinueRow

        src = Trim$(CStr(ws.Cells(r, "F").Value))
        If Len(src) = 0 Then GoTo ContinueRow

        cls = ParseClassNo(ws.Cells(r, "L").Value)
        If cls < 1 Or cls > 4 Then GoTo ContinueRow

        cleaned = Replace(src, "-", "")
        ws.Cells(r, "B").Value = ConvertByClass(cleaned, cls)

ContinueRow:
    Next r

    MsgBox "Done. Column B filled (existing values skipped).", vbInformation
End Sub

Private Function ParseClassNo(ByVal v As Variant) As Long
    Dim s As String
    s = LCase$(Trim$(CStr(v)))
    s = Replace(s, "class", "")
    s = Replace(s, " ", "")

    Select Case s
        Case "1", "i": ParseClassNo = 1
        Case "2", "ii": ParseClassNo = 2
        Case "3", "iii": ParseClassNo = 3
        Case "4", "iv": ParseClassNo = 4
        Case Else
            If IsNumeric(s) Then
                ParseClassNo = CLng(Val(s))
            Else
                ParseClassNo = 0
            End If
    End Select
End Function

Private Function ConvertByClass(ByVal s As String, ByVal cls As Long) As String
    Dim tone As String
    tone = DetectTone(s)

    s = Replace(s, VMarked("macron"), "V")
    s = Replace(s, VMarked("acute"), "V")
    s = Replace(s, VMarked("grave"), "V")

    s = Replace(s, "iV", PatternByClass(cls, "iV", tone))
    s = Replace(s, "Vi", PatternByClass(cls, "Vi", tone))
    s = Replace(s, "uV", PatternByClass(cls, "uV", tone))
    s = Replace(s, "Vu", PatternByClass(cls, "Vu", tone))
    s = Replace(s, "V", PatternByClass(cls, "V", tone))

    ConvertByClass = s
End Function

Private Function DetectTone(ByVal s As String) As String
    If InStr(s, VMarked("macron")) > 0 Then
        DetectTone = "macron"
    ElseIf InStr(s, VMarked("acute")) > 0 Then
        DetectTone = "acute"
    ElseIf InStr(s, VMarked("grave")) > 0 Then
        DetectTone = "grave"
    Else
        DetectTone = "plain"
    End If
End Function

Private Function VMarked(ByVal tone As String) As String
    Select Case tone
        Case "macron": VMarked = "V" & ChrW(&H304)
        Case "acute": VMarked = "V" & ChrW(&H301)
        Case "grave": VMarked = "V" & ChrW(&H300)
        Case Else: VMarked = "V"
    End Select
End Function

Private Function PatternByClass(ByVal cls As Long, ByVal pat As String, ByVal tone As String) As String
    Select Case cls
        Case 1: PatternByClass = PatternAEO(pat, "a", tone)
        Case 2: PatternByClass = PatternAEO(pat, "e", tone)
        Case 3: PatternByClass = PatternAEO(pat, "o", tone)
        Case 4: PatternByClass = PatternClass4(pat, tone)
        Case Else: PatternByClass = pat
    End Select
End Function

Private Function PatternAEO(ByVal pat As String, ByVal base As String, ByVal tone As String) As String
    Dim v As String
    v = ToneAEO(base, tone)

    Select Case pat
        Case "V": PatternAEO = v
        Case "iV": PatternAEO = "i" & v
        Case "Vi": PatternAEO = v & "i"
        Case "uV": PatternAEO = "u" & v
        Case "Vu": PatternAEO = v & "u"
        Case Else: PatternAEO = pat
    End Select
End Function

Private Function PatternClass4(ByVal pat As String, ByVal tone As String) As String
    Select Case pat
        Case "V": PatternClass4 = ToneI4(tone)
        Case "iV": PatternClass4 = U(&H12B) ' iV class4 => always i-macron
        Case "Vi": PatternClass4 = U(&H12B) ' Vi class4 => always i-macron
        Case "uV": PatternClass4 = "u" & ToneI4(tone)
        Case "Vu": PatternClass4 = ToneI4(tone) & "u"
        Case Else: PatternClass4 = pat
    End Select
End Function

Private Function ToneAEO(ByVal ch As String, ByVal tone As String) As String
    Select Case ch
        Case "a"
            Select Case tone
                Case "acute": ToneAEO = U(&HE1)   ' a-acute
                Case "grave": ToneAEO = U(&HE0)   ' a-grave
                Case "macron": ToneAEO = U(&H101) ' a-macron
                Case Else: ToneAEO = "a"
            End Select
        Case "e"
            Select Case tone
                Case "acute": ToneAEO = U(&HE9)
                Case "grave": ToneAEO = U(&HE8)
                Case "macron": ToneAEO = U(&H113)
                Case Else: ToneAEO = "e"
            End Select
        Case "o"
            Select Case tone
                Case "acute": ToneAEO = U(&HF3)
                Case "grave": ToneAEO = U(&HF2)
                Case "macron": ToneAEO = U(&H14D)
                Case Else: ToneAEO = "o"
            End Select
        Case Else
            ToneAEO = ch
    End Select
End Function

Private Function ToneI4(ByVal tone As String) As String
    ' class4: i tone map => ?, i, i, i
    Select Case tone
        Case "macron": ToneI4 = U(&H12B) ' i-macron
        Case "acute": ToneI4 = U(&HED)   ' i-acute
        Case "grave": ToneI4 = U(&HEC)   ' i-grave
        Case Else: ToneI4 = U(&HEF)        ' i-diaeresis
    End Select
End Function

Private Function U(ByVal codePoint As Long) As String
    U = ChrW(codePoint)
End Function
